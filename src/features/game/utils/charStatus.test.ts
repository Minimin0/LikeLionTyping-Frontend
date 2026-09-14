import { describe, expect, it } from 'vitest'

import { canAdvance, getCharCells, groupCellsByWord, hasTypo } from './charStatus'

const statuses = (sentence: string, input: string, isComposing = false) =>
  getCharCells(sentence, input, isComposing).map((cell) => cell.status)

/** 화면에 실제로 그려지는 글자들 */
const rendered = (sentence: string, input: string, isComposing = false) =>
  getCharCells(sentence, input, isComposing)
    .map((cell) => cell.char)
    .join('')

describe('getCharCells — 표시 내용', () => {
  it('아무것도 안 쳤으면 목표 문장이 그대로 보인다', () => {
    expect(rendered('가나다', '')).toBe('가나다')
    expect(statuses('가나다', '')).toEqual(['PENDING', 'PENDING', 'PENDING'])
  })

  it('입력한 부분은 사용자가 친 글자, 나머지는 목표 문장이 이어 붙는다', () => {
    expect(rendered('가나다', '가나')).toBe('가나다')
    expect(statuses('가나다', '가나')).toEqual(['CORRECT', 'CORRECT', 'PENDING'])
  })

  it('오타는 목표 글자가 아니라 사용자가 친 글자를 보여준다', () => {
    expect(rendered('가나다', '가라')).toBe('가라다')
    expect(statuses('가나다', '가라')).toEqual(['CORRECT', 'INCORRECT', 'PENDING'])
  })

  it('문장보다 길게 친 초과 입력분도 오타로 표시한다', () => {
    const cells = getCharCells('가나', '가나다라', false)
    expect(cells.map((cell) => cell.status)).toEqual([
      'CORRECT',
      'CORRECT',
      'INCORRECT',
      'INCORRECT',
    ])
    expect(cells[2]).toMatchObject({ char: '다', isOverflow: true })
  })

  it('공백도 한 글자로 판정한다', () => {
    expect(statuses('가 나', '가_')).toEqual(['CORRECT', 'INCORRECT', 'PENDING'])
  })

  it('영문과 숫자도 동일하게 판정한다', () => {
    expect(statuses('ab12', 'ab13')).toEqual(['CORRECT', 'CORRECT', 'CORRECT', 'INCORRECT'])
  })
})

describe('getCharCells — 한글 자모 단위 진행', () => {
  it('안녕하세요를 ㅇ → 아 → 안 순서로 채워 나가는 동안 전부 진행 중이다', () => {
    // 목표 첫 글자 "안"을 향해 자모가 하나씩 들어오는 과정
    expect(rendered('안녕하세요', 'ㅇ', true)).toBe('ㅇ녕하세요')
    expect(statuses('안녕하세요', 'ㅇ', true)[0]).toBe('COMPOSING')

    expect(rendered('안녕하세요', '아', true)).toBe('아녕하세요')
    expect(statuses('안녕하세요', '아', true)[0]).toBe('COMPOSING')

    expect(rendered('안녕하세요', '안', true)).toBe('안녕하세요')
    expect(statuses('안녕하세요', '안', true)[0]).toBe('COMPOSING')
  })

  it('조합 중이라도 자모가 어긋나면 바로 오타다', () => {
    // 목표 "안"인데 초성 ㄱ을 침
    expect(statuses('안녕하세요', 'ㄱ', true)[0]).toBe('INCORRECT')
    expect(rendered('안녕하세요', 'ㄱ', true)).toBe('ㄱ녕하세요')
  })

  it('조합 중인 글자 이전 글자들은 정상적으로 오타 판정한다', () => {
    expect(statuses('가나다', '가라ㄷ', true)).toEqual(['CORRECT', 'INCORRECT', 'COMPOSING'])
  })

  it('조합이 끝나면 글자 단위로 비교한다', () => {
    expect(statuses('안녕하세요', '안', false)[0]).toBe('CORRECT')
  })
})

describe('groupCellsByWord — 어절 단위 묶기', () => {
  it('공백을 기준으로 어절과 공백 묶음이 번갈아 나온다', () => {
    const chunks = groupCellsByWord(getCharCells('가나 다라', '', false))

    expect(chunks.map((chunk) => chunk.isSpace)).toEqual([false, true, false])
    expect(chunks.map((chunk) => chunk.cells.map((cell) => cell.char).join(''))).toEqual([
      '가나',
      ' ',
      '다라',
    ])
  })

  it('원본 인덱스가 0부터 빠짐없이 순서대로 붙는다 — 색상 판정이 이 값을 쓴다', () => {
    const sentence = '프론트엔드, 백엔드, 기획디자인 세 개의 부서가 있습니다'
    const chunks = groupCellsByWord(getCharCells(sentence, '', false))
    const indices = chunks.flatMap((chunk) => chunk.cells.map((cell) => cell.index))

    expect(indices).toEqual(Array.from({ length: sentence.length }, (_, i) => i))
  })

  it('묶음을 이어 붙이면 원래 렌더링 문자열과 같다', () => {
    const chunks = groupCellsByWord(getCharCells('가나 다라', '가라 다', false))
    const joined = chunks.flatMap((chunk) => chunk.cells.map((cell) => cell.char)).join('')

    // 표시 규칙: 입력한 글자 + 아직 안 친 목표 문장
    expect(joined).toBe('가라 다라')
  })

  it('어절 묶음 안에는 공백이 없고, 공백 묶음 안에는 공백만 있다', () => {
    const chunks = groupCellsByWord(getCharCells('가나  다라', '', false))

    for (const chunk of chunks) {
      const chars = chunk.cells.map((cell) => cell.char)
      if (chunk.isSpace) expect(chars.every((c) => /\s/.test(c))).toBe(true)
      else expect(chars.some((c) => /\s/.test(c))).toBe(false)
    }
  })

  it('연속된 공백은 하나의 공백 묶음이 된다', () => {
    const chunks = groupCellsByWord(getCharCells('가  나', '', false))
    expect(chunks).toHaveLength(3)
    expect(chunks[1].cells).toHaveLength(2)
  })

  it('공백 위치의 오타 상태가 묶음에 그대로 보존된다', () => {
    // 공백 자리에 다른 글자를 친 경우 — 그 셀은 INCORRECT이고 어절 묶음에 들어간다
    const chunks = groupCellsByWord(getCharCells('가 나', '가_', false))
    const typoCell = chunks.flatMap((chunk) => chunk.cells).find((cell) => cell.index === 1)

    expect(typoCell?.status).toBe('INCORRECT')
    expect(typoCell?.char).toBe('_')
  })

  it('빈 문장은 빈 배열이다', () => {
    expect(groupCellsByWord([])).toEqual([])
  })
})

describe('hasTypo', () => {
  it('오타가 없으면 false', () => {
    expect(hasTypo('가나다', '가나', false)).toBe(false)
  })

  it('오타가 있으면 true', () => {
    expect(hasTypo('가나다', '가라', false)).toBe(true)
  })

  it('자모가 맞게 진행 중인 글자는 오타로 잡지 않는다', () => {
    expect(hasTypo('안녕하세요', 'ㅇ', true)).toBe(false)
  })

  it('자모가 어긋난 조합 중 글자는 오타로 잡는다', () => {
    expect(hasTypo('안녕하세요', 'ㄱ', true)).toBe(true)
  })
})

describe('canAdvance', () => {
  it('문장과 완전히 일치하고 조합이 끝났으면 true', () => {
    expect(canAdvance('가나다', '가나다', false)).toBe(true)
  })

  it('조합 중이면 일치해도 false — 조합 확정용 Enter를 제출로 오인하지 않기 위함', () => {
    expect(canAdvance('가나다', '가나다', true)).toBe(false)
  })

  it('오타가 있으면 false', () => {
    expect(canAdvance('가나다', '가라다', false)).toBe(false)
  })

  it('아직 다 치지 않았으면 false', () => {
    expect(canAdvance('가나다', '가나', false)).toBe(false)
  })
})

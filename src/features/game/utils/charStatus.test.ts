import { describe, expect, it } from 'vitest'

import { canAdvance, getCharCells, hasTypo } from './charStatus'

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

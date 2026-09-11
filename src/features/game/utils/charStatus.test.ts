import { describe, expect, it } from 'vitest'

import { canAdvance, getCharCells, hasTypo } from './charStatus'

const statuses = (sentence: string, input: string, isComposing = false) =>
  getCharCells(sentence, input, isComposing).map((cell) => cell.status)

describe('getCharCells', () => {
  it('입력하지 않은 글자는 전부 PENDING이다', () => {
    expect(statuses('가나다', '')).toEqual(['PENDING', 'PENDING', 'PENDING'])
  })

  it('일치하는 글자는 CORRECT, 나머지는 PENDING이다', () => {
    expect(statuses('가나다', '가나')).toEqual(['CORRECT', 'CORRECT', 'PENDING'])
  })

  it('다른 글자는 INCORRECT로 판정한다', () => {
    expect(statuses('가나다', '가라')).toEqual(['CORRECT', 'INCORRECT', 'PENDING'])
  })

  it('공백도 한 글자로 판정한다', () => {
    expect(statuses('가 나', '가_')).toEqual(['CORRECT', 'INCORRECT', 'PENDING'])
  })

  it('문장보다 길게 친 초과 입력분도 오타로 표시한다', () => {
    const cells = getCharCells('가나', '가나다라', false)
    expect(cells.map((cell) => cell.status)).toEqual([
      'CORRECT',
      'CORRECT',
      'INCORRECT',
      'INCORRECT',
    ])
    // 초과 입력분은 사용자가 실제로 친 글자를 그대로 보여준다
    expect(cells[2]).toMatchObject({ char: '다', isOverflow: true })
  })

  it('조합 중인 마지막 글자는 오타로 판정하지 않는다', () => {
    // "가나다"를 치는 중 마지막 글자가 아직 ㄷ 상태인 경우
    expect(statuses('가나다', '가나ㄷ', true)).toEqual(['CORRECT', 'CORRECT', 'COMPOSING'])
  })

  it('조합 중이어도 이전 글자들은 정상적으로 오타 판정한다', () => {
    expect(statuses('가나다', '가라ㄷ', true)).toEqual(['CORRECT', 'INCORRECT', 'COMPOSING'])
  })

  it('영문과 숫자도 동일하게 판정한다', () => {
    expect(statuses('ab12', 'ab13')).toEqual(['CORRECT', 'CORRECT', 'CORRECT', 'INCORRECT'])
  })
})

describe('hasTypo', () => {
  it('오타가 없으면 false', () => {
    expect(hasTypo('가나다', '가나', false)).toBe(false)
  })

  it('오타가 있으면 true', () => {
    expect(hasTypo('가나다', '가라', false)).toBe(true)
  })

  it('조합 중인 글자 때문에 오타로 잡히지 않는다', () => {
    expect(hasTypo('가나다', '가나ㄷ', true)).toBe(false)
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

import { describe, expect, it } from 'vitest'

import { countKeystrokes, countKeystrokesOfText, countMatchedKeystrokes } from './typingCount'

describe('countKeystrokes — 두벌식 타건 수', () => {
  it('받침 있는 일반 글자는 초성+중성+종성 = 3타다', () => {
    // 안 = ㅇ + ㅏ + ㄴ
    expect(countKeystrokes('안')).toBe(3)
  })

  it('받침 없는 일반 글자는 2타다', () => {
    // 하 = ㅎ + ㅏ
    expect(countKeystrokes('하')).toBe(2)
  })

  it('쌍자음 초성은 Shift가 필요하므로 더 많이 센다', () => {
    // 쌍 = ㅆ(2) + ㅏ(1) + ㅇ(1)
    expect(countKeystrokes('쌍')).toBeGreaterThanOrEqual(4)
    expect(countKeystrokes('쌍')).toBe(4)
  })

  it('겹받침은 자음 두 개를 눌러야 하므로 4타다', () => {
    // 값 = ㄱ(1) + ㅏ(1) + ㅄ(2)
    expect(countKeystrokes('값')).toBe(4)
  })

  it('복합모음은 모음 두 개를 눌러야 하므로 3타다', () => {
    // 과 = ㄱ(1) + ㅘ(2)
    expect(countKeystrokes('과')).toBe(3)
  })

  it('단독 자모는 1타다', () => {
    expect(countKeystrokes('ㄱ')).toBe(1)
    expect(countKeystrokes('ㅏ')).toBe(1)
  })

  it('영문 소문자·숫자·공백은 1타, 대문자와 Shift 기호는 2타다', () => {
    expect(countKeystrokes('a')).toBe(1)
    expect(countKeystrokes('1')).toBe(1)
    expect(countKeystrokes(' ')).toBe(1)
    expect(countKeystrokes('A')).toBe(2)
    expect(countKeystrokes('!')).toBe(2)
  })
})

describe('countKeystrokesOfText', () => {
  it('글자별 타건 수의 합이다', () => {
    // 안(3) + 녕(3) + 하(2) + 세(2) + 요(2)
    expect(countKeystrokesOfText('안녕하세요')).toBe(12)
  })

  it('공백도 한 타로 센다', () => {
    expect(countKeystrokesOfText('가 나')).toBe(countKeystrokes('가') + 1 + countKeystrokes('나'))
  })

  it('빈 문자열은 0타다', () => {
    expect(countKeystrokesOfText('')).toBe(0)
  })
})

describe('countMatchedKeystrokes', () => {
  it('앞에서부터 일치하는 구간만 센다', () => {
    expect(countMatchedKeystrokes('안녕하세요', '안녕하')).toBe(countKeystrokesOfText('안녕하'))
  })

  it('첫 오타에서 멈춘다 — 뒤가 맞아도 세지 않는다', () => {
    // "안뎡하"는 두 번째 글자부터 틀렸으므로 "안"까지만 인정된다
    expect(countMatchedKeystrokes('안녕하세요', '안뎡하')).toBe(countKeystrokes('안'))
  })

  it('전부 맞으면 문장 전체 타건 수와 같다', () => {
    expect(countMatchedKeystrokes('안녕하세요', '안녕하세요')).toBe(
      countKeystrokesOfText('안녕하세요'),
    )
  })

  it('문장보다 길게 친 초과 입력분은 세지 않는다', () => {
    expect(countMatchedKeystrokes('안녕', '안녕하세요')).toBe(countKeystrokesOfText('안녕'))
  })

  it('아무것도 안 쳤으면 0타다', () => {
    expect(countMatchedKeystrokes('안녕하세요', '')).toBe(0)
  })

  it('첫 글자부터 틀리면 0타다', () => {
    expect(countMatchedKeystrokes('안녕하세요', '반녕하세요')).toBe(0)
  })
})

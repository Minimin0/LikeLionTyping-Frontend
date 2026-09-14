import { describe, expect, it } from 'vitest'

import { decomposeHangul, isHangulPrefix } from './hangul'

describe('decomposeHangul', () => {
  it('종성이 있는 음절은 초성/중성/종성 세 칸으로 분해한다', () => {
    // 안 = ㅇ(11) + ㅏ(0) + ㄴ(4)
    expect(decomposeHangul('안')).toHaveLength(3)
  })

  it('종성이 없는 음절은 초성/중성 두 칸으로 분해한다', () => {
    expect(decomposeHangul('아')).toHaveLength(2)
  })

  it('같은 초성으로 시작하는 글자들은 첫 칸이 같다', () => {
    const [choOfA] = decomposeHangul('아')
    const [choOfAn] = decomposeHangul('안')
    const [choOfEung] = decomposeHangul('ㅇ')

    expect(choOfA).toBe(choOfAn)
    expect(choOfEung).toBe(choOfAn)
  })

  it('단독 자음은 초성 한 칸으로 인식한다', () => {
    expect(decomposeHangul('ㅇ')).toHaveLength(1)
    expect(decomposeHangul('ㄱ')).toHaveLength(1)
  })

  it('단독 모음은 초성 자리와 겹치지 않는 값으로 인식한다', () => {
    // 초성 ㄱ과 중성 ㅏ는 둘 다 인덱스 0이라 자리 구분이 없으면 같은 값이 된다
    expect(decomposeHangul('ㅏ')).not.toEqual(decomposeHangul('ㄱ'))
  })

  it('영문과 숫자는 한 글자를 한 단위로 취급한다', () => {
    expect(decomposeHangul('a')).toHaveLength(1)
    expect(decomposeHangul('1')).toHaveLength(1)
    expect(decomposeHangul('a')).not.toEqual(decomposeHangul('b'))
  })
})

describe('isHangulPrefix', () => {
  it('초성만 입력한 상태는 진행 중으로 인정한다', () => {
    // 목표 "안"을 향해 ㅇ → 아 → 안 순서로 채워지는 과정
    expect(isHangulPrefix('안', 'ㅇ')).toBe(true)
    expect(isHangulPrefix('안', '아')).toBe(true)
    expect(isHangulPrefix('안', '안')).toBe(true)
  })

  it('초성이 다르면 진행 중이 아니다 (오타)', () => {
    expect(isHangulPrefix('안', 'ㄱ')).toBe(false)
    expect(isHangulPrefix('안', '가')).toBe(false)
  })

  it('중성이 다르면 진행 중이 아니다', () => {
    expect(isHangulPrefix('안', '어')).toBe(false)
  })

  it('종성이 다르면 진행 중이 아니다', () => {
    expect(isHangulPrefix('안', '알')).toBe(false)
  })

  it('목표보다 많이 입력하면 진행 중이 아니다', () => {
    // 목표가 "아"인데 종성까지 붙여 "안"을 만든 경우
    expect(isHangulPrefix('아', '안')).toBe(false)
  })

  it('모음을 먼저 치면 진행 중이 아니다', () => {
    expect(isHangulPrefix('안', 'ㅏ')).toBe(false)
  })

  it('영문도 같은 글자면 진행 중으로 본다', () => {
    expect(isHangulPrefix('a', 'a')).toBe(true)
    expect(isHangulPrefix('a', 'b')).toBe(false)
  })

  it('빈 문자열은 진행 중이 아니다', () => {
    expect(isHangulPrefix('', 'ㅇ')).toBe(false)
    expect(isHangulPrefix('안', '')).toBe(false)
  })
})

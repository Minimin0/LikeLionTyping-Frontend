import { describe, expect, it } from 'vitest'

import { calculateElapsedMs } from './elapsed'
import { formatElapsedMs } from '@/shared/utils/formatTime'

describe('calculateElapsedMs', () => {
  it('두 시각의 차이를 정수 ms로 반환한다', () => {
    expect(calculateElapsedMs(1000, 44821)).toBe(43821)
  })

  it('소수점은 반올림한다 (Backend는 정수 ms만 받는다)', () => {
    expect(calculateElapsedMs(0, 43821.4)).toBe(43821)
    expect(calculateElapsedMs(0, 43821.6)).toBe(43822)
  })

  it('시작과 끝이 같으면 0이다', () => {
    expect(calculateElapsedMs(5000, 5000)).toBe(0)
  })

  it('역전된 값이 들어와도 음수 기록을 만들지 않는다', () => {
    expect(calculateElapsedMs(5000, 4000)).toBe(0)
  })
})

describe('formatElapsedMs', () => {
  it('1분 미만은 SS.mmm 형식이다', () => {
    expect(formatElapsedMs(43821)).toBe('43.821')
  })

  it('밀리초는 항상 세 자리로 채운다', () => {
    expect(formatElapsedMs(43007)).toBe('43.007')
  })

  it('1분 이상은 MM:SS.mmm 형식이다', () => {
    expect(formatElapsedMs(63821)).toBe('01:03.821')
  })

  it('0은 00.000이다', () => {
    expect(formatElapsedMs(0)).toBe('00.000')
  })
})

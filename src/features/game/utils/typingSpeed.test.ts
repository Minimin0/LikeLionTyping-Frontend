import { describe, expect, it } from 'vitest'

import { MIN_ELAPSED_MS_FOR_CPM, calculateCpm } from './typingSpeed'

describe('calculateCpm', () => {
  it('1분 동안 친 타건 수가 그대로 타수가 된다', () => {
    expect(calculateCpm(300, 60000)).toBe(300)
  })

  it('30초에 150타면 300타/분이다', () => {
    expect(calculateCpm(150, 30000)).toBe(300)
  })

  it('정수로 반올림한다', () => {
    expect(Number.isInteger(calculateCpm(100, 33333))).toBe(true)
  })

  it('시작 직후에는 0을 반환한다 — Infinity나 비정상적으로 큰 값을 막는다', () => {
    expect(calculateCpm(0, 0)).toBe(0)
    expect(calculateCpm(10, 1)).toBe(0)
    expect(calculateCpm(10, MIN_ELAPSED_MS_FOR_CPM - 1)).toBe(0)
  })

  it('경과 시간이 임계값을 넘으면 계산을 시작한다', () => {
    expect(calculateCpm(10, MIN_ELAPSED_MS_FOR_CPM)).toBeGreaterThan(0)
  })

  it('어떤 입력에도 NaN이나 Infinity가 나오지 않는다', () => {
    for (const [keystrokes, elapsed] of [
      [0, 0],
      [0, 60000],
      [1000, 1],
      [1, 600000],
    ]) {
      const cpm = calculateCpm(keystrokes, elapsed)
      expect(Number.isFinite(cpm)).toBe(true)
    }
  })

  it('같은 타건 수라면 시간이 흐를수록 타수가 내려간다 (오타 수정 중 동작)', () => {
    const before = calculateCpm(100, 10000)
    const after = calculateCpm(100, 20000)
    expect(after).toBeLessThan(before)
  })
})

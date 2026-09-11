import { describe, expect, it } from 'vitest'

import { UNIVERSITIES, pickUniversities } from './universities'

describe('UNIVERSITIES', () => {
  it('80개 대학이 중복 없이 들어있다', () => {
    expect(UNIVERSITIES).toHaveLength(80)
    expect(new Set(UNIVERSITIES).size).toBe(80)
  })

  it('우리 학교인 성결대가 포함되어 있다', () => {
    expect(UNIVERSITIES).toContain('성결대')
  })
})

describe('pickUniversities', () => {
  it('요청한 개수만큼 반환한다', () => {
    expect(pickUniversities(20)).toHaveLength(20)
    expect(pickUniversities()).toHaveLength(20)
  })

  it('첫 번째는 항상 성결대다', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(pickUniversities(20)[0]).toBe('성결대')
    }
  })

  it('중복 없이 뽑는다', () => {
    for (let i = 0; i < 20; i += 1) {
      const picked = pickUniversities(20)
      expect(new Set(picked).size).toBe(picked.length)
    }
  })

  it('성결대는 한 번만 나온다', () => {
    const picked = pickUniversities(20)
    expect(picked.filter((name) => name === '성결대')).toHaveLength(1)
  })

  it('전부 실제 대학 목록에 있는 이름이다', () => {
    for (const name of pickUniversities(20)) {
      expect(UNIVERSITIES).toContain(name)
    }
  })

  it('호출할 때마다 2번째 이후 순서가 달라진다', () => {
    // 79개 중 19개를 순서까지 포함해 뽑으므로 두 결과가 같을 확률은 사실상 0이다.
    const runs = Array.from({ length: 5 }, () => pickUniversities(20).join('|'))
    expect(new Set(runs).size).toBeGreaterThan(1)
  })

  it('원본 배열을 훼손하지 않는다', () => {
    const before = [...UNIVERSITIES]
    pickUniversities(20)
    expect(UNIVERSITIES).toEqual(before)
  })
})

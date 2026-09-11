import { describe, expect, it } from 'vitest'

import { UNIVERSITIES } from './universities'
import { UNIVERSITY_COORDS } from './universityCoords'

describe('UNIVERSITY_COORDS', () => {
  it('80개 대학 전부에 좌표가 있다', () => {
    const missing = UNIVERSITIES.filter((name) => !UNIVERSITY_COORDS[name])
    expect(missing).toEqual([])
  })

  it('대학 목록에 없는 키가 섞여 있지 않다', () => {
    const extra = Object.keys(UNIVERSITY_COORDS).filter((name) => !UNIVERSITIES.includes(name))
    expect(extra).toEqual([])
  })

  it('항목 수가 대학 수와 같다', () => {
    expect(Object.keys(UNIVERSITY_COORDS)).toHaveLength(UNIVERSITIES.length)
  })

  it('모든 좌표가 대한민국 경위도 범위 안에 있다', () => {
    for (const [name, [lon, lat]] of Object.entries(UNIVERSITY_COORDS)) {
      expect(lon, `${name}의 경도`).toBeGreaterThan(125.6)
      expect(lon, `${name}의 경도`).toBeLessThan(129.8)
      expect(lat, `${name}의 위도`).toBeGreaterThan(33.0)
      expect(lat, `${name}의 위도`).toBeLessThan(38.7)
    }
  })

  it('성결대는 경기 안양 부근이다', () => {
    const [lon, lat] = UNIVERSITY_COORDS['성결대']
    expect(lon).toBeCloseTo(126.93, 1)
    expect(lat).toBeCloseTo(37.38, 1)
  })

  it('제주대만 제주도 위도에 있다', () => {
    const inJeju = Object.entries(UNIVERSITY_COORDS).filter(([, [, lat]]) => lat < 34)
    expect(inJeju.map(([name]) => name)).toEqual(['제주대'])
  })
})

import { describe, expect, it } from 'vitest'

import {
  MAP_HEIGHT,
  MAP_WIDTH,
  distanceBetween,
  getZoomLevel,
  interpolate,
  project,
  toSmoothClosedPath,
} from './mapProjection'

/** 실제 지점들 */
const GANGWON_NORTH: [number, number] = [128.4, 38.58] // 고성 부근
const SOUTH_COAST: [number, number] = [126.7, 34.32] // 해남 부근
const JEJU: [number, number] = [126.561, 33.456]
const SEOUL: [number, number] = [126.978, 37.566]
const POHANG: [number, number] = [129.389, 36.103]
const INCHEON: [number, number] = [126.633, 37.375]

describe('project — 남북 위치', () => {
  it('강원 북부는 지도 위쪽, 남해안은 아래쪽에 놓인다', () => {
    // SVG는 y가 아래로 증가하므로 북쪽일수록 y가 작다
    expect(project(GANGWON_NORTH).y).toBeLessThan(project(SOUTH_COAST).y)
  })

  it('제주는 남해안보다도 아래쪽이다', () => {
    expect(project(JEJU).y).toBeGreaterThan(project(SOUTH_COAST).y)
  })

  it('서울은 지도 위쪽 절반에 있다', () => {
    expect(project(SEOUL).y).toBeLessThan(MAP_HEIGHT / 2)
  })
})

describe('project — 동서 위치', () => {
  it('포항(동쪽)이 인천(서쪽)보다 오른쪽에 놓인다', () => {
    expect(project(POHANG).x).toBeGreaterThan(project(INCHEON).x)
  })

  it('경도가 같으면 x도 같다', () => {
    expect(project([127.0, 35.0]).x).toBe(project([127.0, 38.0]).x)
  })
})

describe('project — 캔버스 범위', () => {
  it('국내 좌표는 캔버스 안에 들어온다', () => {
    for (const coords of [GANGWON_NORTH, SOUTH_COAST, JEJU, SEOUL, POHANG, INCHEON]) {
      const { x, y } = project(coords)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(MAP_WIDTH)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(MAP_HEIGHT)
    }
  })

  it('가로세로 비율이 실제 한국 종횡비(약 0.6)에 가깝다', () => {
    // 코사인 보정이 실제로 먹혀야 나오는 값이다.
    // 보정이 상쇄되면 0.75 근처가 되어 국토가 옆으로 뚱뚱해진다.
    expect(MAP_WIDTH / MAP_HEIGHT).toBeCloseTo(0.6, 1)
  })

  it('제주도가 캔버스 아래쪽에서 잘리지 않도록 여백이 있다', () => {
    // 제주 남단(약 33.1도)도 캔버스 안에 들어와야 한다
    expect(project([126.5, 33.1]).y).toBeLessThan(MAP_HEIGHT)
  })
})

describe('getZoomLevel', () => {
  it('거리가 멀수록 배율이 작아진다 (두 지점이 모두 보이게)', () => {
    const seoulInner = getZoomLevel(20)
    const metro = getZoomLevel(80)
    const regional = getZoomLevel(200)
    const jeju = getZoomLevel(500)

    expect(seoulInner).toBeGreaterThan(metro)
    expect(metro).toBeGreaterThan(regional)
    expect(regional).toBeGreaterThan(jeju)
  })

  it('서울 안 이동은 캠퍼스가 구분되도록 크게 확대한다', () => {
    expect(getZoomLevel(10)).toBeGreaterThanOrEqual(5)
  })

  it('아주 먼 이동도 1배 미만으로 축소하지는 않는다', () => {
    expect(getZoomLevel(9999)).toBeGreaterThan(1)
  })
})

describe('distanceBetween', () => {
  it('두 점 사이의 직선 거리를 반환한다', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('toSmoothClosedPath', () => {
  it('닫힌 베지어 path를 만든다', () => {
    const path = toSmoothClosedPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ])

    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    // 직선(L)이 아니라 곡선(C)으로 이어야 해안선이 각져 보이지 않는다
    expect(path).toContain('C')
    expect(path).not.toContain('L')
  })

  it('점이 3개 미만이면 빈 문자열이다', () => {
    expect(toSmoothClosedPath([{ x: 0, y: 0 }])).toBe('')
  })
})

describe('interpolate', () => {
  const from = { x: 0, y: 0 }
  const to = { x: 100, y: 50 }

  it('진행률 0이면 시작점, 1이면 도착점이다', () => {
    expect(interpolate(from, to, 0)).toEqual({ x: 0, y: 0 })
    expect(interpolate(from, to, 1)).toEqual({ x: 100, y: 50 })
  })

  it('중간 진행률은 선형 보간한다', () => {
    expect(interpolate(from, to, 0.5)).toEqual({ x: 50, y: 25 })
  })

  it('범위를 벗어난 진행률은 0~1로 잘라낸다', () => {
    expect(interpolate(from, to, -1)).toEqual({ x: 0, y: 0 })
    expect(interpolate(from, to, 2)).toEqual({ x: 100, y: 50 })
  })
})

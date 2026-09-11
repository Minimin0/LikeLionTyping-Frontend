import { describe, expect, it } from 'vitest'

import { buildRoutePoints, findPointAt, findPreviousPoint, toPolylinePoints } from './mapRoute'

describe('buildRoutePoints', () => {
  it('이름 순서를 그대로 유지한다 — 백엔드가 준 출제 순서를 바꾸면 안 된다', () => {
    const points = buildRoutePoints(['성결대', '서울대', '제주대'])
    expect(points.map((point) => point.name)).toEqual(['성결대', '서울대', '제주대'])
  })

  it('좌표가 없는 이름은 지도에서 건너뛴다 — 백엔드가 모르는 대학을 줄 수 있다', () => {
    const points = buildRoutePoints(['성결대', '없는대학교', '제주대'])

    expect(points.map((point) => point.name)).toEqual(['성결대', '제주대'])
    // 건너뛰어도 원본 배열에서의 순번은 그대로 유지해야 현재 항목을 찾을 수 있다
    expect(points.map((point) => point.index)).toEqual([0, 2])
  })

  it('좌표가 하나도 없어도 빈 배열을 돌려줄 뿐 예외를 던지지 않는다', () => {
    expect(() => buildRoutePoints(['없는대학교', '또없는대'])).not.toThrow()
    expect(buildRoutePoints(['없는대학교'])).toEqual([])
  })
})

describe('findPointAt', () => {
  const points = buildRoutePoints(['성결대', '없는대학교', '제주대'])

  it('출제 순번으로 지점을 찾는다', () => {
    expect(findPointAt(points, 2)?.name).toBe('제주대')
  })

  it('좌표가 없는 순번이면 undefined다', () => {
    expect(findPointAt(points, 1)).toBeUndefined()
  })
})

describe('findPreviousPoint', () => {
  const points = buildRoutePoints(['성결대', '없는대학교', '제주대'])

  it('중간에 좌표 없는 대학이 끼어 있어도 선이 끊기지 않도록 그 앞 지점을 찾는다', () => {
    expect(findPreviousPoint(points, 2)?.name).toBe('성결대')
  })

  it('첫 번째 항목은 이전 지점이 없다', () => {
    expect(findPreviousPoint(points, 0)).toBeUndefined()
  })
})

describe('toPolylinePoints', () => {
  it('SVG polyline이 읽을 수 있는 좌표 문자열을 만든다', () => {
    const result = toPolylinePoints(buildRoutePoints(['성결대', '제주대']))
    expect(result).toMatch(/^[\d.]+,[\d.]+ [\d.]+,[\d.]+$/)
  })

  it('빈 배열이면 빈 문자열이다', () => {
    expect(toPolylinePoints([])).toBe('')
  })
})

/**
 * 출제 순서대로 받은 이름 목록을 지도 위 경로로 바꾼다.
 *
 * 좌표를 못 찾은 이름은 경로에서 빠진다. 백엔드가 좌표 맵에 없는 대학 이름을
 * 내려줄 수 있는데, 그때 크래시하거나 타이핑을 막으면 안 되기 때문이다.
 * 지도에만 안 보일 뿐 게임은 그대로 진행된다.
 *
 * 순서는 절대 바꾸지 않는다. 백엔드가 준 sentences 순서가 곧 출제 순서다.
 */
import { UNIVERSITY_COORDS } from '../constants/universityCoords'
import { project } from './mapProjection'

export interface RoutePoint {
  /** 원본 sentences 배열에서의 위치 */
  index: number
  name: string
  x: number
  y: number
}

/**
 * 이름 목록을 SVG 좌표로 변환한다.
 * project()를 여기서 한 번에 다 돌려두기 때문에 타이핑 중에는 재계산이 없다.
 */
export function buildRoutePoints(names: string[]): RoutePoint[] {
  const points: RoutePoint[] = []

  names.forEach((name, index) => {
    const coords = UNIVERSITY_COORDS[name]
    if (!coords) return

    const { x, y } = project(coords)
    points.push({ index, name, x, y })
  })

  return points
}

/** 특정 출제 순번에 해당하는 지도 위 지점 (좌표가 없으면 undefined) */
export function findPointAt(points: RoutePoint[], index: number): RoutePoint | undefined {
  return points.find((point) => point.index === index)
}

/**
 * 현재 순번 직전에 있는 "좌표가 있는" 지점.
 * 중간에 좌표 없는 대학이 끼어 있어도 선이 끊기지 않도록 가장 가까운 앞 지점을 찾는다.
 */
export function findPreviousPoint(points: RoutePoint[], index: number): RoutePoint | undefined {
  let previous: RoutePoint | undefined

  for (const point of points) {
    if (point.index >= index) break
    previous = point
  }

  return previous
}

/** 점들을 직선으로 이은 polyline points 속성 문자열 */
export function toPolylinePoints(points: RoutePoint[]): string {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
}

/**
 * 위경도(lon, lat)를 SVG 좌표로 변환한다.
 *
 * 지도 외곽선과 대학 마커가 반드시 이 함수 하나만 통과해야 한다.
 * 서로 다른 방식으로 좌표를 만들면 국토 모양과 마커 위치가 미묘하게 어긋나
 * "대학이 바다 위에 찍히는" 문제가 생긴다.
 */

/**
 * 대한민국을 감싸는 경위도 범위.
 * 제주도가 아래쪽에서 잘리지 않도록 남쪽에 여백을 넉넉히 뒀다.
 */
const LON_MIN = 125.5
const LON_MAX = 129.9
const LAT_MIN = 32.9
const LAT_MAX = 38.8

/**
 * 한국 중앙 위도(약 36도)에서 경도 1도는 위도 1도보다 짧다(자오선이 극에서 모이므로).
 *
 * 주의: 이 보정을 project() 안에서 분자·분모에 함께 곱하면 그대로 약분되어
 * 아무 효과가 없다. 실제로 모양을 바로잡으려면 캔버스 가로폭을 정할 때 적용해야 한다.
 */
const LAT_SCALE = Math.cos((36 * Math.PI) / 180)

/** 세로를 기준으로 잡고 가로는 실제 지리 비율에서 역산한다. */
export const MAP_HEIGHT = 1000
export const MAP_WIDTH = MAP_HEIGHT * (((LON_MAX - LON_MIN) * LAT_SCALE) / (LAT_MAX - LAT_MIN))

export interface Point {
  x: number
  y: number
}

export function project([lon, lat]: [number, number]): Point {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH,
    // SVG는 y축이 아래로 증가하는데 위도는 위로 증가하므로 뒤집는다.
    y: (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT,
  }
}

/**
 * 이전 대학에서 현재 대학까지의 거리(SVG 단위)로 확대 배율을 정한다.
 *
 * 서울 안에서의 이동과 서울→제주 이동에 같은 배율을 쓰면 안 된다.
 * 가까우면 크게 확대해 캠퍼스가 구분되게 하고, 멀면 덜 확대해 두 지점이 모두 보이게 한다.
 */
export function getZoomLevel(distance: number): number {
  if (distance < 40) return 5.0 // 서울 안 이동
  if (distance < 120) return 3.5 // 수도권 내 이동
  if (distance < 300) return 2.4 // 지방 간 이동
  return 1.8 // 제주 등 아주 먼 이동
}

/** 첫 대학은 이전 지점이 없어 거리를 잴 수 없으므로 이 배율로 시작한다. */
export const DEFAULT_ZOOM = 3.5

export function distanceBetween(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

/**
 * 꼭짓점들을 Catmull-Rom 스플라인으로 이어 부드러운 닫힌 path를 만든다.
 *
 * 좌표를 L(직선)으로 그대로 이으면 해안선이 각진 다각형처럼 보인다.
 * 각 구간의 제어점을 앞뒤 점에서 뽑아 베지어로 바꾸면 실제 해안선처럼 완만해진다.
 */
export function toSmoothClosedPath(points: Point[]): string {
  const count = points.length
  if (count < 3) return ''

  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`

  for (let i = 0; i < count; i += 1) {
    const previous = points[(i - 1 + count) % count]
    const current = points[i]
    const next = points[(i + 1) % count]
    const afterNext = points[(i + 2) % count]

    // Catmull-Rom → 3차 베지어 제어점 변환 공식
    const c1x = current.x + (next.x - previous.x) / 6
    const c1y = current.y + (next.y - previous.y) / 6
    const c2x = next.x - (afterNext.x - current.x) / 6
    const c2y = next.y - (afterNext.y - current.y) / 6

    path += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`
  }

  return `${path} Z`
}

/** from에서 to까지 progress(0~1)만큼 나아간 지점 */
export function interpolate(from: Point, to: Point, progress: number): Point {
  const clamped = Math.min(1, Math.max(0, progress))
  return {
    x: from.x + (to.x - from.x) * clamped,
    y: from.y + (to.y - from.y) * clamped,
  }
}

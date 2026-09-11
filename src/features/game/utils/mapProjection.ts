/**
 * 위경도(lon, lat)를 SVG 좌표로 변환한다.
 *
 * 지도 외곽선과 대학 마커가 반드시 이 함수 하나만 통과해야 한다.
 * 서로 다른 방식으로 좌표를 만들면 국토 모양과 마커 위치가 미묘하게 어긋나
 * "대학이 바다 위에 찍히는" 문제가 생긴다.
 */

/** 대한민국(제주 포함)을 감싸는 경위도 범위 */
const LON_MIN = 125.6
const LON_MAX = 129.8
const LAT_MIN = 33.0
const LAT_MAX = 38.7

/**
 * 경도 1도의 실제 거리는 위도가 올라갈수록 짧아진다(자오선이 극에서 모이므로).
 * 한국 중앙 위도(약 36도)의 코사인을 곱해 가로 폭을 줄이지 않으면
 * 국토가 옆으로 뚱뚱하게 늘어나 보인다.
 */
const LON_SCALE = Math.cos((36 * Math.PI) / 180)

/** 실제 지리 비율. 이 값으로 캔버스 가로폭을 정해야 모양이 왜곡되지 않는다. */
const ASPECT_RATIO = ((LON_MAX - LON_MIN) * LON_SCALE) / (LAT_MAX - LAT_MIN)

export const MAP_HEIGHT = 520
export const MAP_WIDTH = Math.round(MAP_HEIGHT * ASPECT_RATIO)

export interface Point {
  x: number
  y: number
}

export function project([lon, lat]: [number, number]): Point {
  // 경위도를 0~1 범위로 정규화한 뒤 캔버스 크기를 곱한다.
  // 가로 비율 보정은 MAP_WIDTH를 정할 때 이미 반영되어 있다.
  const nx = (lon - LON_MIN) / (LON_MAX - LON_MIN)
  const ny = (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)

  return {
    x: nx * MAP_WIDTH,
    // SVG는 y축이 아래로 증가하는데 위도는 위로 증가하므로 뒤집는다.
    y: (1 - ny) * MAP_HEIGHT,
  }
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

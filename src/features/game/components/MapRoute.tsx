/**
 * 경로 레이어 — 전체 미리보기 점선 / 지나온 실선 / 현재 구간.
 *
 * 타이핑할 때마다 바뀌는 것은 현재 구간 선의 끝점 좌표 하나뿐이다.
 * 나머지 두 경로는 문장이 넘어갈 때만 다시 계산한다.
 */
import { useMemo } from 'react'

import { interpolate } from '../utils/mapProjection'
import { findPointAt, findPreviousPoint, toPolylinePoints } from '../utils/mapRoute'
import type { RoutePoint } from '../utils/mapRoute'

interface MapRouteProps {
  points: RoutePoint[]
  currentIndex: number
  /** 현재 항목의 입력 진행률 0~1 */
  progress: number
}

export function MapRoute({ points, currentIndex, progress }: MapRouteProps) {
  // 20개 대학 전체를 잇는 옅은 점선. 게임 내내 바뀌지 않는다.
  const previewPoints = useMemo(() => toPolylinePoints(points), [points])

  // 이미 통과한 구간. 문장이 넘어갈 때만 다시 만든다.
  const visitedPoints = useMemo(
    () => toPolylinePoints(points.filter((point) => point.index <= currentIndex)),
    [points, currentIndex],
  )

  const from = findPreviousPoint(points, currentIndex)
  const to = findPointAt(points, currentIndex)
  // 첫 번째 대학은 이전 지점이 없으므로 선을 그리지 않고 마커만 강조한다.
  const head = from && to ? interpolate(from, to, progress) : null

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* 1. 아직 안 지난 경로 — 처음부터 20개가 전부 이어져 보이게 한다 */}
      <polyline
        points={previewPoints}
        stroke="var(--color-route-todo)"
        strokeWidth={1.5}
        strokeOpacity={0.22}
        strokeDasharray="2 6"
      />

      {/* 2. 지나온 경로 — 점선 위에 실선으로 덧그려 채워진 느낌을 준다 */}
      <polyline points={visitedPoints} stroke="var(--color-route-done)" strokeWidth={2} />

      {/* 3. 현재 구간 — 진행률만큼만 뻗는다. 오타가 나면 진행률이 줄어 선이 되돌아온다. */}
      {from && head && (
        <>
          <line
            x1={from.x}
            y1={from.y}
            x2={head.x}
            y2={head.y}
            stroke="var(--color-map-accent)"
            strokeWidth={2.5}
          />
          <circle cx={head.x} cy={head.y} r={3} fill="var(--color-map-accent)" stroke="none" />
        </>
      )}
    </g>
  )
}

/**
 * 우측 하단 미니맵.
 *
 * 본지도는 현재 대학 주변으로 확대되기 때문에 전국에서 지금 어디쯤인지 감이 사라진다.
 * 미니맵은 확대하지 않고 전국 고정이라 그 맥락을 계속 보여준다.
 *
 * 지나온 경로와 현재 위치만 보여준다. 순번이 바뀔 때만 다시 계산하면 되므로
 * memo로 타이핑 중 재렌더를 막는다.
 */
import { memo, useMemo } from 'react'

import { MAP_HEIGHT, MAP_WIDTH } from '../utils/mapProjection'
import { findPointAt, toPolylinePoints } from '../utils/mapRoute'
import type { RoutePoint } from '../utils/mapRoute'
import { JEJU_ELLIPSE, MAINLAND_PATH } from '../utils/mapShapes'

interface MiniMapProps {
  points: RoutePoint[]
  currentIndex: number
  className?: string
}

export const MiniMap = memo(function MiniMap({ points, currentIndex, className }: MiniMapProps) {
  // 본지도와 마찬가지로 앞으로 갈 곳은 미리 보여주지 않는다. 지나온 경로만 그린다.
  const visitedPoints = useMemo(
    () => toPolylinePoints(points.filter((point) => point.index <= currentIndex)),
    [points, currentIndex],
  )
  const current = findPointAt(points, currentIndex)

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      // 본지도와 같은 정보를 축약해 보여줄 뿐이라 스크린리더에는 노출하지 않는다.
      aria-hidden="true"
    >
      <path d={MAINLAND_PATH} fill="var(--color-map-land)" fillOpacity={0.1} />
      <ellipse {...JEJU_ELLIPSE} fill="var(--color-map-land)" fillOpacity={0.1} />
      <path
        d={MAINLAND_PATH}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={4}
        strokeOpacity={0.3}
      />

      <polyline
        points={visitedPoints}
        fill="none"
        stroke="var(--color-route-done)"
        strokeWidth={5}
        strokeOpacity={0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {current && <circle cx={current.x} cy={current.y} r={16} fill="var(--color-map-accent)" />}
    </svg>
  )
})

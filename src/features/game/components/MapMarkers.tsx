/**
 * 대학 점 마커 레이어.
 *
 * 현재 위치는 MapPin이 따로 그리므로 여기서는 "지나온 곳"과 "아직 안 간 곳"만 찍는다.
 * currentIndex가 바뀔 때만 다시 그리면 되므로 memo로 감싼다.
 * (타이핑 중에는 마커가 전혀 변하지 않는다)
 */
import { memo } from 'react'

import type { RoutePoint } from '../utils/mapRoute'

interface MapMarkersProps {
  points: RoutePoint[]
  currentIndex: number
}

export const MapMarkers = memo(function MapMarkers({ points, currentIndex }: MapMarkersProps) {
  return (
    <g>
      {points.map((point) => {
        // 현재 목표는 핀으로 따로 그리므로 여기서는 건너뛴다.
        if (point.index === currentIndex) return null

        const isVisited = point.index < currentIndex

        if (isVisited) {
          return (
            <g key={point.index}>
              <circle cx={point.x} cy={point.y} r={4} fill="var(--color-route-done)" />
              <circle
                cx={point.x}
                cy={point.y}
                r={6.5}
                fill="none"
                stroke="var(--color-route-done)"
                strokeWidth={1}
                strokeOpacity={0.45}
              />
            </g>
          )
        }

        // 서울권은 마커가 서로 겹치므로 미통과 마커를 옅게 둬서
        // 현재 핀이 점 무더기에 묻히지 않게 한다.
        return (
          <circle
            key={point.index}
            cx={point.x}
            cy={point.y}
            r={2.5}
            fill="var(--color-route-todo)"
            fillOpacity={0.35}
          />
        )
      })}
    </g>
  )
})

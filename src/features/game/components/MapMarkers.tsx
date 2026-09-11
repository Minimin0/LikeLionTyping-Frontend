/**
 * 대학 점 마커 레이어.
 *
 * 각 마커는 카메라 그룹 "안"에 있으면서 scale(1/zoom)으로 역보정된다.
 * 이렇게 해야 (1) 카메라가 움직일 때 지도와 정확히 같이 따라가고
 * (2) 확대해도 점 크기가 커지지 않는다.
 * 마커를 카메라 그룹 바깥에 두고 화면 좌표를 직접 계산하면, 카메라 transition이
 * 도는 동안 마커만 다른 궤적으로 움직여 지도에서 떨어져 보인다.
 */
import { memo } from 'react'

import type { RoutePoint } from '../utils/mapRoute'

/** 이 배율 이상으로 확대됐을 때만 이름 라벨을 함께 띄운다. */
const LABEL_VISIBLE_ZOOM = 3

interface MapMarkersProps {
  points: RoutePoint[]
  currentIndex: number
  zoom: number
}

export const MapMarkers = memo(function MapMarkers({
  points,
  currentIndex,
  zoom,
}: MapMarkersProps) {
  // 전국 뷰에서 서울 27개 라벨이 전부 뜨면 화면이 글자로 뒤덮인다.
  const showLabels = zoom >= LABEL_VISIBLE_ZOOM

  return (
    <g>
      {points.map((point) => {
        // 현재 목표는 핀으로 따로 그리므로 여기서는 건너뛴다.
        if (point.index === currentIndex) return null

        const isVisited = point.index < currentIndex

        return (
          <g
            key={point.index}
            className="map-scaled"
            transform={`translate(${point.x}, ${point.y}) scale(${1 / zoom})`}
          >
            {isVisited ? (
              <>
                <circle r={4} fill="var(--color-route-done)" />
                <circle
                  r={6.5}
                  fill="none"
                  stroke="var(--color-route-done)"
                  strokeWidth={1}
                  strokeOpacity={0.45}
                />
              </>
            ) : (
              // 서울권은 마커가 서로 겹치므로 미통과 마커를 옅게 둬서
              // 현재 핀이 점 무더기에 묻히지 않게 한다.
              <circle r={2.5} fill="var(--color-route-todo)" fillOpacity={0.3} />
            )}

            {showLabels && !isVisited && (
              <text
                y={-7}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-map-stroke)"
                fillOpacity={0.55}
              >
                {point.name}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
})

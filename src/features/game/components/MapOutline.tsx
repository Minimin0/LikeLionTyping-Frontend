/**
 * 대한민국 국토 외곽선 (정적 레이어).
 *
 * 경로 데이터가 상수라 컴포넌트 바깥에서 한 번만 계산한다.
 * 타이핑할 때마다 path 문자열을 다시 만들면 입력이 밀린다.
 */
import { memo } from 'react'

import {
  JEJU_CENTER,
  JEJU_RADIUS_LAT,
  JEJU_RADIUS_LON,
  KOREA_MAINLAND,
} from '../constants/koreaOutline'
import { project, toSmoothClosedPath } from '../utils/mapProjection'

// 모듈 로드 시 한 번만 계산한다. 외곽선은 절대 바뀌지 않는다.
const MAINLAND_PATH = toSmoothClosedPath(KOREA_MAINLAND.map(project))

// 제주도는 타원 하나로 충분하다. 중심과 반지름 모두 같은 project()를 통과시켜야
// 본토·마커와 위치가 어긋나지 않는다.
const JEJU = project(JEJU_CENTER)
const JEJU_EDGE = project([JEJU_CENTER[0] + JEJU_RADIUS_LON, JEJU_CENTER[1] - JEJU_RADIUS_LAT])
const JEJU_RX = Math.abs(JEJU_EDGE.x - JEJU.x)
const JEJU_RY = Math.abs(JEJU_EDGE.y - JEJU.y)

export const MapOutline = memo(function MapOutline() {
  return (
    <g>
      {/*
       * 바깥쪽 글로우 한 겹. 같은 path를 굵고 아주 옅게 한 번 더 그려서
       * 지도가 배경 위에 떠 있는 느낌을 준다. filter: blur보다 훨씬 가볍다.
       */}
      <path
        d={MAINLAND_PATH}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={6}
        strokeOpacity={0.08}
        strokeLinejoin="round"
      />
      <ellipse
        cx={JEJU.x}
        cy={JEJU.y}
        rx={JEJU_RX}
        ry={JEJU_RY}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={6}
        strokeOpacity={0.08}
      />

      {/* 국토 채움 — 배경보다 살짝 밝게, 아주 옅게 */}
      <path d={MAINLAND_PATH} fill="var(--color-map-land)" fillOpacity={0.08} />
      <ellipse
        cx={JEJU.x}
        cy={JEJU.y}
        rx={JEJU_RX}
        ry={JEJU_RY}
        fill="var(--color-map-land)"
        fillOpacity={0.08}
      />

      {/* 윤곽선 — 가늘고 선명하게 */}
      <path
        d={MAINLAND_PATH}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={1}
        strokeOpacity={0.3}
        strokeLinejoin="round"
      />
      <ellipse
        cx={JEJU.x}
        cy={JEJU.y}
        rx={JEJU_RX}
        ry={JEJU_RY}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={1}
        strokeOpacity={0.3}
      />
    </g>
  )
})

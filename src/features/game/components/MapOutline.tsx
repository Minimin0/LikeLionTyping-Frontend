/**
 * 대한민국 국토 외곽선 (정적 레이어).
 *
 * path 문자열은 mapShapes에서 모듈 로드 시 한 번만 계산된다.
 * 카메라가 움직인다고 다시 만들면 안 된다. 움직이는 것은 감싸는 <g>의 transform뿐이다.
 *
 * 모든 stroke에 vector-effect="non-scaling-stroke"를 준다.
 * 카메라가 5배까지 확대하는데 이걸 빼면 윤곽선도 5배로 굵어져 해안선이 뭉개진다.
 */
import { memo } from 'react'

import { JEJU_ELLIPSE, MAINLAND_PATH } from '../utils/mapShapes'

export const MapOutline = memo(function MapOutline() {
  return (
    <g vectorEffect="non-scaling-stroke">
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
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        {...JEJU_ELLIPSE}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={6}
        strokeOpacity={0.08}
        vectorEffect="non-scaling-stroke"
      />

      {/* 국토 채움 — 배경보다 살짝 밝게, 아주 옅게 */}
      <path d={MAINLAND_PATH} fill="var(--color-map-land)" fillOpacity={0.08} />
      <ellipse {...JEJU_ELLIPSE} fill="var(--color-map-land)" fillOpacity={0.08} />

      {/* 윤곽선 — 가늘고 선명하게 */}
      <path
        d={MAINLAND_PATH}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={1.2}
        strokeOpacity={0.35}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        {...JEJU_ELLIPSE}
        fill="none"
        stroke="var(--color-map-stroke)"
        strokeWidth={1.2}
        strokeOpacity={0.35}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  )
})

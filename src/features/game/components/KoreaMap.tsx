/**
 * CH.02 전용 지도 연출.
 *
 * 출제되는 대학을 하나씩 지나며 경로가 이어진다.
 * 외부 지도 라이브러리나 타일 서버를 쓰지 않고 순수 SVG로 그린다.
 * 축제 부스에서 외부 네트워크에 의존하면 안 되기 때문이다.
 */
import { useMemo } from 'react'

import { MapMarkers } from './MapMarkers'
import { MapOutline } from './MapOutline'
import { MapPin } from './MapPin'
import { MapRoute } from './MapRoute'
import { MAP_HEIGHT, MAP_WIDTH } from '../utils/mapProjection'
import { buildRoutePoints, findPointAt, findPreviousPoint } from '../utils/mapRoute'

/** 카메라가 현재 구간을 따라가는 기능. 문제가 생기면 이 값만 false로 바꾸면 된다. */
const ENABLE_CAMERA_FOLLOW = true
/** 최대 확대 배율. 전국이 한눈에 보여야 하므로 아주 약하게만 준다. */
const CAMERA_SCALE = 1.08
/** 완전히 중앙에 맞추지 않고 이만큼만 따라간다. 1이면 화면 밖으로 국토가 밀려난다. */
const CAMERA_DAMPING = 0.2
/** 카메라가 움직여도 국토가 잘리지 않도록 viewBox에 주는 여백 */
const VIEW_PADDING = 26

interface KoreaMapProps {
  /** 이번 세션의 출제 이름 목록 (백엔드가 준 순서 그대로) */
  names: string[]
  currentIndex: number
  /** 현재 항목의 입력 진행률 0~1 */
  progress: number
  className?: string
}

export function KoreaMap({ names, currentIndex, progress, className }: KoreaMapProps) {
  // project()는 이름 목록이 정해진 시점에 한 번만 돌린다.
  // 타이핑할 때마다 80개 좌표를 다시 변환하면 입력이 밀린다.
  const points = useMemo(() => buildRoutePoints(names), [names])

  const current = findPointAt(points, currentIndex)
  const previous = findPreviousPoint(points, currentIndex)

  // 현재 구간의 중간 지점을 화면 중앙 쪽으로 살짝 당긴다.
  const focus = current ?? previous
  const cameraTransform = useMemo(() => {
    if (!ENABLE_CAMERA_FOLLOW || !focus) return undefined

    const dx = (MAP_WIDTH / 2 - focus.x) * CAMERA_DAMPING
    const dy = (MAP_HEIGHT / 2 - focus.y) * CAMERA_DAMPING
    // 지도 중심을 기준으로 확대한 뒤 이동시킨다.
    const tx = ((1 - CAMERA_SCALE) * MAP_WIDTH) / 2 + dx
    const ty = ((1 - CAMERA_SCALE) * MAP_HEIGHT) / 2 + dy

    return `translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${CAMERA_SCALE})`
  }, [focus])

  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-map-bg)]',
        className ?? '',
      ].join(' ')}
    >
      <svg
        viewBox={`${-VIEW_PADDING} ${-VIEW_PADDING} ${MAP_WIDTH + VIEW_PADDING * 2} ${MAP_HEIGHT + VIEW_PADDING * 2}`}
        className="h-auto w-full"
        role="img"
        aria-label="전국 멋쟁이사자처럼 대학 경로 지도"
      >
        <g className="map-camera" transform={cameraTransform}>
          <MapOutline />
          <MapRoute points={points} currentIndex={currentIndex} progress={progress} />
          <MapMarkers points={points} currentIndex={currentIndex} />
          {/* 핀은 항상 맨 위에 와야 하므로 마지막에 그린다. */}
          {current && (
            <MapPin x={current.x} y={current.y} name={current.name} index={current.index} />
          )}
        </g>
      </svg>
    </div>
  )
}

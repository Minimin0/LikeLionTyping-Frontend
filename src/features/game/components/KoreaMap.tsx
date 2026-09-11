/**
 * CH.02 전용 지도 연출. 화면 전체를 채우는 주 무대다.
 *
 * 현재 타이핑 중인 대학 주변으로 확대되며, 다음 대학으로 넘어갈 때는
 * 살짝 줌아웃하며 이동한 뒤 다시 줌인한다. 확대된 채로 미끄러지면
 * 어디로 가는지 알아보기 어렵기 때문이다.
 *
 * 외부 지도 라이브러리나 타일 서버를 쓰지 않고 순수 SVG로 그린다.
 * 축제 부스에서 외부 네트워크에 의존하면 안 되기 때문이다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'

import { MapMarkers } from './MapMarkers'
import { MapOutline } from './MapOutline'
import { MapPin } from './MapPin'
import { MapRoute } from './MapRoute'
import { MiniMap } from './MiniMap'
import {
  DEFAULT_ZOOM,
  MAP_HEIGHT,
  MAP_WIDTH,
  distanceBetween,
  getZoomLevel,
} from '../utils/mapProjection'
import { buildRoutePoints, findPointAt, findPreviousPoint } from '../utils/mapRoute'

/**
 * 핀이 놓일 화면 세로 위치.
 * 타이핑 텍스트가 화면 중앙(47%) 부근에 오므로, 핀은 그보다 충분히 위에 둬야 가려지지 않는다.
 * viewBox 높이가 컨테이너 높이와 1:1로 대응하므로 이 비율이 곧 화면상 위치다.
 */
const PIN_ANCHOR_Y = 0.28
/** 이동 중 잠깐 줌아웃하는 비율. 두 대학이 함께 보이도록 배율을 낮춘다. */
const TRANSIT_ZOOM_RATIO = 0.55
const MIN_TRANSIT_ZOOM = 1.2
/** 줌아웃 상태로 이동하는 시간 */
const TRANSIT_MS = 320
const CAMERA_TRANSITION = 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)'

interface KoreaMapProps {
  /** 이번 세션의 출제 이름 목록 (백엔드가 준 순서 그대로) */
  names: string[]
  currentIndex: number
  /** 현재 항목의 입력 진행률 0~1 */
  progress: number
  className?: string
}

/**
 * 컨테이너의 가로세로 비율을 읽는다.
 * viewBox를 화면 비율에 맞춰야 레터박스 없이 화면을 꽉 채우고,
 * 핀을 정확히 "세로 40% 지점"에 놓을 수 있다.
 */
function useContainerAspect(ref: React.RefObject<HTMLDivElement | null>): number {
  const [aspect, setAspect] = useState(16 / 9)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setAspect(width / height)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return aspect
}

export function KoreaMap({ names, currentIndex, progress, className }: KoreaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aspect = useContainerAspect(containerRef)
  const prefersReducedMotion = usePrefersReducedMotion()

  // project()는 이름 목록이 정해진 시점에 한 번만 돌린다.
  // 타이핑할 때마다 좌표를 다시 변환하면 입력이 밀린다.
  const points = useMemo(() => buildRoutePoints(names), [names])

  const current = findPointAt(points, currentIndex)
  const previous = findPreviousPoint(points, currentIndex)
  const focusPoint = current ?? previous

  // 이전 대학과의 거리로 목표 배율을 정한다. 서울 안 이동과 제주행에 같은 배율을 쓰면 안 된다.
  const targetZoom = useMemo(() => {
    if (!current || !previous) return DEFAULT_ZOOM
    return getZoomLevel(distanceBetween(previous, current))
  }, [current, previous])

  /*
   * 다음 대학으로 넘어가는 동안만 잠깐 줌아웃한다.
   * 순번이 바뀐 것을 렌더 중에 바로 알아채야 줌아웃이 카메라 이동과 같은 프레임에
   * 시작된다. 이펙트에서 켜면 한 프레임 늦어서 확대된 채로 미끄러지는 게 보인다.
   */
  const [transitIndex, setTransitIndex] = useState<number | null>(null)
  const [seenIndex, setSeenIndex] = useState(currentIndex)

  if (seenIndex !== currentIndex) {
    setSeenIndex(currentIndex)
    setTransitIndex(prefersReducedMotion ? null : currentIndex)
  }

  useEffect(() => {
    if (transitIndex === null) return
    const timerId = window.setTimeout(() => setTransitIndex(null), TRANSIT_MS)
    return () => window.clearTimeout(timerId)
  }, [transitIndex])

  const zoom =
    transitIndex !== null ? Math.max(MIN_TRANSIT_ZOOM, targetZoom * TRANSIT_ZOOM_RATIO) : targetZoom

  // viewBox를 화면 비율에 맞춘다. 세로는 지도 전체, 가로는 화면 비율만큼 잘라 쓴다.
  const viewWidth = MAP_HEIGHT * aspect
  const viewX = (MAP_WIDTH - viewWidth) / 2

  /*
   * 카메라 변환: 목표 대학(px, py)을 화면의 (가로 중앙, 세로 28%) 지점으로 끌어온다.
   * scale(zoom)이 먼저 적용되므로 translate 값에도 zoom을 곱해 상쇄해야 한다.
   */
  const focusX = MAP_WIDTH / 2
  const focusY = MAP_HEIGHT * PIN_ANCHOR_Y
  const tx = focusPoint ? focusX - focusPoint.x * zoom : 0
  const ty = focusPoint ? focusY - focusPoint.y * zoom : 0

  return (
    <div ref={containerRef} className={className}>
      <svg
        viewBox={`${viewX} 0 ${viewWidth} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="전국 멋쟁이사자처럼 대학 경로 지도"
      >
        <g
          transform={`translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${zoom})`}
          // 카메라 이동은 CSS transition에 맡긴다. 매 프레임 좌표를 갱신하면 입력이 밀린다.
          style={prefersReducedMotion ? undefined : { transition: CAMERA_TRANSITION }}
        >
          <MapOutline />
          <MapRoute points={points} currentIndex={currentIndex} progress={progress} zoom={zoom} />
          <MapMarkers points={points} currentIndex={currentIndex} zoom={zoom} />

          {/* 핀은 항상 맨 위에 와야 하므로 마지막에 그린다.
              scale(1/zoom)으로 역보정해서 확대해도 핀 크기가 일정하다. */}
          {current && (
            <g
              className="map-pin map-scaled"
              transform={`translate(${current.x}, ${current.y}) scale(${1 / zoom})`}
            >
              <MapPin name={current.name} index={current.index} />
            </g>
          )}
        </g>
      </svg>

      <MiniMap
        points={points}
        currentIndex={currentIndex}
        className="pointer-events-none absolute bottom-4 right-4 hidden h-[200px] w-[120px] opacity-45 sm:block"
      />
    </div>
  )
}

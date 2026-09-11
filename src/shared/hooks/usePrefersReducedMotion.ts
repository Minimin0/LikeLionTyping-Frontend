/**
 * 사용자가 "모션 줄이기"를 켜 두었는지 알려준다.
 * CSS만으로 끌 수 없는 연출(카메라 단계 전환 등)을 JS에서 건너뛰는 데 쓴다.
 *
 * matchMedia는 React 바깥의 외부 저장소이므로 useSyncExternalStore로 구독한다.
 * useEffect + useState로 흉내내면 첫 렌더에서 한 박자 늦게 반영된다.
 */
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** 테스트 환경(jsdom)에는 matchMedia가 없을 수 있으므로 확인하고 쓴다. */
function getMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

function subscribe(onChange: () => void): () => void {
  const media = getMediaQuery()
  if (!media) return () => {}

  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return getMediaQuery()?.matches ?? false
}

/** 서버 렌더링 시에는 모션을 켜 둔 기본값으로 본다. */
function getServerSnapshot(): boolean {
  return false
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

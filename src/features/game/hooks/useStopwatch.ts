/**
 * 게임 경과 시간 측정 훅.
 *
 * 화면 표시용 값(displayMs)과 Backend로 보내는 공식 기록(stop()의 반환값)을 분리한다.
 * 화면 값은 requestAnimationFrame으로 갱신되므로 프레임 타이밍에 따라 마지막 몇 ms가
 * 다를 수 있지만, 공식 기록은 항상 stop()이 호출된 순간의 performance.now()로 계산한다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { calculateElapsedMs } from '../utils/elapsed'

export function useStopwatch() {
  // performance.now() 기준 시작 시각. Date.now()를 쓰지 않는 이유는 utils/elapsed.ts 참고.
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const [displayMs, setDisplayMs] = useState(0)

  const cancelLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  /** 카운트다운이 끝나는 순간 호출한다. 이 시점이 공식 기록의 시작점이다. */
  const start = useCallback(() => {
    cancelLoop()
    startTimeRef.current = performance.now()
    setDisplayMs(0)

    const tick = () => {
      if (startTimeRef.current === null) return
      setDisplayMs(calculateElapsedMs(startTimeRef.current, performance.now()))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [cancelLoop])

  /** 마지막 문장 입력 완료 순간 호출한다. 공식 기록(정수 ms)을 반환한다. */
  const stop = useCallback((): number => {
    cancelLoop()
    if (startTimeRef.current === null) return 0

    const elapsed = calculateElapsedMs(startTimeRef.current, performance.now())
    setDisplayMs(elapsed)
    return elapsed
  }, [cancelLoop])

  useEffect(() => cancelLoop, [cancelLoop])

  return { displayMs, start, stop }
}

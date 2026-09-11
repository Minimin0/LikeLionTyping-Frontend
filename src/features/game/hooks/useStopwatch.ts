/**
 * 게임 경과 시간의 기준점을 관리하는 훅.
 *
 * 여기서는 state를 들지 않고 "지금 몇 ms 지났는지"를 읽어주기만 한다.
 * 갱신 주기에 맞춰 화면을 다시 그리는 일은 GameMeters가 맡는다.
 * 경과 시간을 이 훅의 state로 들면 GamePage 전체가 초당 10번 리렌더되어
 * 문장 표시와 입력창까지 끌려 들어가기 때문이다.
 */
import { useCallback, useRef } from 'react'

import { calculateElapsedMs } from '../utils/elapsed'

export function useStopwatch() {
  // performance.now() 기준 시작 시각. Date.now()를 쓰지 않는 이유는 utils/elapsed.ts 참고.
  const startTimeRef = useRef<number | null>(null)

  /** 카운트다운이 끝나는 순간 호출한다. 이 시점이 공식 기록의 시작점이다. */
  const start = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  /**
   * 호출 시점까지의 경과 시간(정수 ms).
   * 화면 갱신에도 쓰고, 마지막 문장 완료 시 공식 기록을 확정할 때도 쓴다.
   * 둘이 같은 기준을 쓰기 때문에 표시값과 기록이 어긋나지 않는다.
   */
  const getElapsedMs = useCallback((): number => {
    if (startTimeRef.current === null) return 0
    return calculateElapsedMs(startTimeRef.current, performance.now())
  }, [])

  return { start, getElapsedMs }
}

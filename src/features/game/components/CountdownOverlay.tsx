/**
 * 게임 시작 전 3초 카운트다운 오버레이.
 * 카운트가 0이 되는 순간 onComplete가 호출되고, 그 시점이 곧 기록 측정 시작점이다.
 */
import { useEffect, useRef, useState } from 'react'

/** 게임 시작 전 카운트다운 초. 이 값이 0이 되는 순간부터 시간 측정이 시작된다. */
const COUNTDOWN_SECONDS = 3

interface CountdownOverlayProps {
  onComplete: () => void
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(COUNTDOWN_SECONDS)

  // onComplete는 부모가 렌더링할 때마다 새 함수가 될 수 있다.
  // 이걸 effect 의존성에 그대로 두면 부모 리렌더마다 타이머가 초기화돼
  // 카운트다운이 늘어나고, 결국 기록 측정 시작 시점이 밀린다.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (count <= 0) {
      onCompleteRef.current()
      return
    }
    const timer = window.setTimeout(() => setCount((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [count])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-surface/95 backdrop-blur-sm">
      <span className="flex items-center gap-2 rounded-full bg-onair/15 px-4 py-1.5 text-sm font-semibold tracking-widest text-onair">
        <span className="h-2 w-2 animate-pulse-air rounded-full bg-onair" />
        ON AIR
      </span>

      <span key={count} className="tabular text-8xl font-bold text-ink sm:text-9xl">
        {count > 0 ? count : 'GO'}
      </span>

      <p className="text-ink-muted">잠시 후 첫 문장이 공개됩니다</p>
    </div>
  )
}

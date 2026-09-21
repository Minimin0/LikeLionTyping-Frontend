/**
 * 게임 시작 전 3초 카운트다운.
 * 카운트가 0이 되는 순간 onComplete가 호출되고, 그 시점이 곧 기록 측정 시작점이다.
 *
 * 「게임 준비」 카드와 같은 정사각형 카드 안에서 일어난다 — 전체화면으로 덮지 않는다.
 * 배경도 종이 질감 그대로, 상단 헤더도 그대로 남겨서 다른 화면처럼 느껴지지 않게 한다.
 */
import { useEffect, useRef, useState } from 'react'
import { useAppAudio } from '../../../shared/audio/AudioProvider'

/** 게임 시작 전 카운트다운 초. 이 값이 0이 되는 순간부터 시간 측정이 시작된다. */
const COUNTDOWN_SECONDS = 3

interface CountdownOverlayProps {
  onComplete: () => void
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(COUNTDOWN_SECONDS)
  const { playCountdownTick, playCountdownGo } = useAppAudio()

  // onComplete는 부모가 렌더링할 때마다 새 함수가 될 수 있다.
  // 이걸 effect 의존성에 그대로 두면 부모 리렌더마다 타이머가 초기화돼
  // 카운트다운이 늘어나고, 결국 기록 측정 시작 시점이 밀린다.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (count > 0) playCountdownTick()
    else playCountdownGo()
  }, [count, playCountdownGo, playCountdownTick])

  useEffect(() => {
    if (count <= 0) {
      onCompleteRef.current()
      return
    }
    const timer = window.setTimeout(() => setCount((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [count])

  return (
    <div className="game-countdown">
      {/*
        key={count}로 매번 새 span을 마운트해 countdown-pop 애니메이션이
        숫자가 바뀔 때마다 다시 실행되게 한다. (타이밍 로직은 위 effect 그대로다)
      */}
      <span
        key={count}
        className="game-countdown-number tabular text-accent"
        aria-live="assertive"
      >
        {count > 0 ? count : 'GO'}
      </span>
      <p className="game-countdown-caption text-ink-muted">잠시 후 첫 문장이 공개됩니다</p>
    </div>
  )
}

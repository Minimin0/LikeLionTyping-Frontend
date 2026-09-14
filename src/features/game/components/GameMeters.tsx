/**
 * 경과 시간과 타수를 함께 갱신하는 계기판.
 *
 * 타이머를 이 컴포넌트 하나만 소유한다.
 * - 스톱워치용과 타수용 타이머를 따로 돌리면 같은 순간의 경과 시간이 서로 어긋나
 *   타수가 이유 없이 튄다.
 * - 갱신 state를 GamePage가 들면 초당 10번 페이지 전체가 리렌더되어
 *   문장 표시와 입력창까지 끌려 들어간다. 그래서 여기 가둬 둔다.
 *
 * 경과 시간의 기준점(언제부터 잰 시간인지)은 GamePage가 결정해 getElapsedMs로
 * 내려준다. 이 컴포넌트는 그 값을 100ms마다 읽어서 화면만 갱신할 뿐,
 * 타이머 기준점 자체를 소유하지 않는다.
 */
import { useEffect, useState } from 'react'

import { calculateCpm } from '../utils/typingSpeed'
import { Stopwatch } from './Stopwatch'
import { TypingSpeed } from './TypingSpeed'

/** 갱신 주기. 초당 10회면 사람 눈에는 충분히 실시간으로 보인다. */
const TICK_MS = 100

interface GameMetersProps {
  /** PLAYING일 때만 true. false가 되면 타이머가 즉시 멈춘다. */
  running: boolean
  /** 지금까지의 경과 시간을 읽어오는 함수 */
  getElapsedMs: () => number
  /** 정확히 입력된 구간의 누적 타건 수 */
  keystrokes: number
}

export function GameMeters({ running, getElapsedMs, keystrokes }: GameMetersProps) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (!running) return

    // 첫 틱은 100ms 뒤에 온다. 그 사이 실제 경과 시간도 0에 가까우므로
    // 굳이 렌더 중에 한 번 더 채워 넣지 않는다.
    const timerId = window.setInterval(() => setElapsedMs(getElapsedMs()), TICK_MS)

    // 상태가 바뀌거나 화면을 벗어나면 타이머를 반드시 정리한다.
    return () => window.clearInterval(timerId)
  }, [running, getElapsedMs])

  return (
    <div className="flex items-start gap-5 sm:gap-7">
      <Stopwatch elapsedMs={elapsedMs} isRunning={running} />
      <TypingSpeed cpm={calculateCpm(keystrokes, elapsedMs)} />
    </div>
  )
}

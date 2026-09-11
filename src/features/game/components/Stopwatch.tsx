/**
 * 경과 시간 표시 컴포넌트.
 * 여기 보이는 값은 화면 표시용이며, Backend로 전송되는 공식 기록과는 별개다.
 */
import { formatElapsedMs } from '@/shared/utils/formatTime'

interface StopwatchProps {
  elapsedMs: number
  /** 측정 중일 때 ON AIR 시그널을 함께 보여준다 */
  isRunning?: boolean
}

export function Stopwatch({ elapsedMs, isRunning = false }: StopwatchProps) {
  return (
    <div className="flex items-center gap-3">
      {isRunning && (
        <span className="flex items-center gap-1.5 rounded-full bg-onair/15 px-2.5 py-1 text-xs font-semibold text-onair">
          <span className="h-1.5 w-1.5 animate-pulse-air rounded-full bg-onair" />
          ON AIR
        </span>
      )}
      {/* tabular로 자릿수 폭을 고정해 숫자가 바뀔 때 레이아웃이 흔들리지 않게 한다. */}
      <span className="tabular text-3xl font-semibold text-ink sm:text-4xl">
        {formatElapsedMs(elapsedMs)}
      </span>
    </div>
  )
}

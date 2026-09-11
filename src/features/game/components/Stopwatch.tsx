/**
 * 경과 시간 표시 컴포넌트.
 * 여기 보이는 값은 화면 표시용이며, Backend로 전송되는 공식 기록과는 별개다.
 */
import { formatElapsedMs } from '@/shared/utils/formatTime'

interface StopwatchProps {
  elapsedMs: number
  /** 측정 중일 때 ON AIR 시그널(깜빡이는 점)을 함께 보여준다 */
  isRunning?: boolean
}

export function Stopwatch({ elapsedMs, isRunning = false }: StopwatchProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      {/* tabular로 자릿수 폭을 고정해 숫자가 바뀔 때 레이아웃이 흔들리지 않게 한다. */}
      <span className="tabular text-2xl font-semibold text-ink sm:text-3xl">
        {formatElapsedMs(elapsedMs)}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
        {isRunning && <span className="h-1.5 w-1.5 animate-pulse-air rounded-full bg-onair" />}
        경과 시간
      </span>
    </div>
  )
}

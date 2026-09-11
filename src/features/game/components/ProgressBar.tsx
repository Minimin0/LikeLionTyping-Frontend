/**
 * 문장 진행 상태 표시 (현재 문장 / 전체 문장 + 진행 막대).
 */
interface ProgressBarProps {
  /** 현재 문장 번호 (1-based) */
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? ((current - 1) / total) * 100 : 0

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between text-sm text-ink-muted">
        {/* CH.02는 문장이 아니라 대학 이름이므로 "문장"이라고 쓰지 않는다 */}
        <span>진행</span>
        <span className="tabular">
          <span className="text-ink">{current}</span> / {total}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

/**
 * 현재 타수(타/분) 표시.
 * 화면 표시 전용 값이며 백엔드로 전송하지 않는다. (API 명세서에 없는 필드)
 */
interface TypingSpeedProps {
  cpm: number
}

export function TypingSpeed({ cpm }: TypingSpeedProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      {/* tabular로 자릿수 폭을 고정해 숫자가 바뀔 때 레이아웃이 흔들리지 않게 한다. */}
      <span className="tabular text-xl font-semibold text-ink sm:text-2xl">
        {cpm}
        <span className="ml-1 text-sm font-medium text-ink-muted">타</span>
      </span>
      <span className="text-[11px] text-ink-muted">현재 타수</span>
    </div>
  )
}

/**
 * 타이핑 입력창.
 * IME/Enter 처리는 전부 useTypingInput 훅이 담당하고, 여기서는 렌더링만 한다.
 */
import { useTypingInput } from '../hooks/useTypingInput'

interface TypingInputProps {
  value: string
  /** 현재 입력해야 할 문장 */
  target: string
  /** 오타가 남아있는지 여부 (테두리/안내 문구용) */
  hasTypo: boolean
  disabled: boolean
  onChange: (value: string) => void
  onComposingChange: (isComposing: boolean) => void
  onSubmitSentence: () => void
}

export function TypingInput({
  value,
  target,
  hasTypo,
  disabled,
  onChange,
  onComposingChange,
  onSubmitSentence,
}: TypingInputProps) {
  const {
    inputRef,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    handleBlur,
  } = useTypingInput({ target, disabled, onChange, onComposingChange, onSubmitSentence })

  const isReadyToSubmit = !hasTypo && value === target && value.length > 0

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="위 문장을 그대로 입력하세요"
        aria-label="타이핑 입력창"
        aria-invalid={hasTypo}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={[
          'w-full rounded-xl border-2 bg-surface-soft px-4 py-3.5 text-lg text-ink outline-none transition-colors sm:text-xl',
          'placeholder:text-ink-dim disabled:cursor-not-allowed disabled:opacity-50',
          hasTypo ? 'border-typing-typo' : isReadyToSubmit ? 'border-accent' : 'border-line',
        ].join(' ')}
      />

      <p className="mt-2 min-h-[1.25rem] text-sm" role="status">
        {hasTypo ? (
          <span className="text-typing-typo">오타를 수정해야 다음 문장으로 넘어갈 수 있어요</span>
        ) : isReadyToSubmit ? (
          <span className="text-accent">Enter를 눌러 다음으로 넘어가세요</span>
        ) : (
          <span className="text-ink-dim">문장을 정확히 입력한 뒤 Enter를 누르세요</span>
        )}
      </p>
    </div>
  )
}

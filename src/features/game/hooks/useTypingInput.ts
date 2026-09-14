/**
 * 숨겨진 입력창의 이벤트 처리 훅. 이 프로젝트에서 가장 까다로운 한글 IME 처리를 담당한다.
 *
 * [왜 IME 처리가 필요한가]
 * 한글은 ㄱ → 가 → 각 처럼 "조합 중"이라는 중간 상태가 존재한다.
 * 이때 사용자가 조합을 확정하려고 누르는 Enter가 keydown 이벤트로도 잡히는데,
 * 이걸 그대로 "문장 제출"로 처리하면 사용자가 의도하지 않았는데 다음으로 넘어간다.
 * 그래서 compositionstart/compositionend로 조합 상태를 추적하고,
 * 조합이 끝난 뒤의 Enter만 제출로 인정한다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CompositionEvent as ReactCompositionEvent,
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react'

interface UseTypingInputParams {
  /** 현재 입력해야 할 문장 */
  target: string
  /** 입력을 받지 않아야 하는 상태(카운트다운/제출 중/결과) */
  disabled: boolean
  onChange: (value: string) => void
  onComposingChange: (isComposing: boolean) => void
  /** 문장이 정확히 일치한 상태에서 Enter가 눌렸을 때만 호출된다 */
  onSubmitSentence: () => void
}

export function useTypingInput({
  target,
  disabled,
  onChange,
  onComposingChange,
  onSubmitSentence,
}: UseTypingInputParams) {
  const inputRef = useRef<HTMLInputElement>(null)
  // keydown 시점에 조합 여부를 동기적으로 읽어야 해서 state가 아닌 ref로도 들고 있는다.
  const isComposingRef = useRef(false)
  const [isFocused, setIsFocused] = useState(false)

  // 게임 화면에 들어오면 바로 칠 수 있어야 한다.
  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
    },
    [onChange],
  )

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
    onComposingChange(true)
  }, [onComposingChange])

  const handleCompositionEnd = useCallback(
    (event: ReactCompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false
      onComposingChange(false)
      // 브라우저에 따라 compositionend가 change보다 늦게 오는 경우가 있어
      // 조합이 확정된 최종 값을 여기서 한 번 더 반영한다.
      onChange(event.currentTarget.value)
    },
    [onChange, onComposingChange],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return

      // 조합 중 Enter는 "조합 확정"이지 "문장 제출"이 아니다.
      // preventDefault를 하면 IME 확정 자체가 막힐 수 있으므로 그냥 브라우저에 맡기고 빠진다.
      // nativeEvent.isComposing도 함께 보는 건 브라우저마다 composition 이벤트 순서가
      // 달라서 ref만으로는 놓치는 케이스가 있기 때문이다.
      if (isComposingRef.current || event.nativeEvent.isComposing) return

      event.preventDefault()
      if (disabled) return
      // 오타가 남아있거나 아직 다 못 쳤으면 넘어가지 않는다.
      if (event.currentTarget.value !== target) return

      onSubmitSentence()
    },
    [disabled, target, onSubmitSentence],
  )

  const handleFocus = useCallback(() => setIsFocused(true), [])

  const handleBlur = useCallback(() => {
    if (disabled) return
    // 부스에서 화면을 잘못 터치해 포커스가 풀려도 게임이 멈추지 않도록 즉시 되돌린다.
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      // 브라우저 창 자체가 포커스를 잃은 경우처럼 복구가 안 될 때만 안내를 띄운다.
      // (복구되는 경우까지 매번 안내를 켜면 한 프레임씩 깜빡인다)
      if (document.activeElement !== inputRef.current) setIsFocused(false)
    })
  }, [disabled])

  /** 화면 아무 곳이나 눌렀을 때 숨겨진 입력창으로 포커스를 되돌린다. */
  const focusInput = useCallback(() => inputRef.current?.focus(), [])

  return {
    inputRef,
    /** 숨겨진 입력창이 포커스를 잡고 있는지. false면 "클릭해서 계속 입력하세요" 안내를 띄운다. */
    isFocused,
    focusInput,
    /** 숨겨진 <input>에 그대로 펼쳐 넣는 이벤트 핸들러 묶음 */
    inputProps: {
      onChange: handleChange,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      onFocus: handleFocus,
    },
  }
}

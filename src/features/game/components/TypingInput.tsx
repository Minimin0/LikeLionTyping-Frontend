/**
 * 화면에 보이지 않는 실제 입력창.
 *
 * 한글 IME는 DOM의 실제 입력 요소에서만 compositionstart/compositionend를 발생시킨다.
 * 입력창을 아예 없애고 keydown만 듣는 방식으로는 한글 조합을 받을 수 없어서,
 * 요소는 유지하되 시각적으로만 감춘다.
 *
 * display:none / visibility:hidden 을 쓰면 안 되는 이유:
 * 두 속성은 요소를 포커스 불가 상태로 만들기 때문에 포커스도, IME 조합도 동작하지 않는다.
 * 그래서 opacity:0 + 1px 크기로 감춘다.
 */
import type { RefObject } from 'react'

import type { useTypingInput } from '../hooks/useTypingInput'

interface TypingInputProps {
  value: string
  disabled: boolean
  inputRef: RefObject<HTMLInputElement | null>
  inputProps: ReturnType<typeof useTypingInput>['inputProps']
}

export function TypingInput({ value, disabled, inputRef, inputProps }: TypingInputProps) {
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label="타이핑 입력창"
      {...inputProps}
      // caret-transparent / outline-none: 감춰둔 요소라도 브라우저가 커서나 포커스 링을
      // 그려서 파란 선이 새어 나오는 것을 막는다.
      className="absolute left-0 top-0 h-px w-px border-0 bg-transparent p-0 text-transparent caret-transparent opacity-0 outline-none"
    />
  )
}

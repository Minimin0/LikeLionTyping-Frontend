/**
 * 제시 문장을 글자 단위로 색칠해 보여주는 컴포넌트.
 * 판정 자체는 하지 않고, utils/charStatus.ts가 계산한 결과를 그리기만 한다.
 */
import { getCharCells } from '../utils/charStatus'
import type { CharCell } from '../types/game.types'

interface SentenceDisplayProps {
  sentence: string
  input: string
  isComposing: boolean
}

/** 글자 상태별 색상. 원색 유틸리티 대신 tailwind.config.js의 토큰만 사용한다. */
const STATUS_CLASS: Record<CharCell['status'], string> = {
  // 아직 입력하지 않은 글자
  PENDING: 'text-typing-pending',
  // 정확히 입력한 글자
  CORRECT: 'text-typing-correct',
  // 오타 — 색만으로는 눈에 잘 안 띄어 밑줄과 배경까지 같이 준다
  INCORRECT:
    'text-typing-typo underline decoration-2 underline-offset-4 bg-typing-typo/15 rounded-sm',
  // 한글 조합 중 — 아직 판정 전이라 정타보다 연하게 표시한다
  COMPOSING: 'text-typing-composing',
}

export function SentenceDisplay({ sentence, input, isComposing }: SentenceDisplayProps) {
  const cells = getCharCells(sentence, input, isComposing)
  // 커서는 다음에 쳐야 할 위치에 놓는다.
  const caretIndex = input.length

  return (
    <p className="typing-sentence" aria-label={sentence}>
      {cells.map((cell, index) => (
        <span key={index} className="relative">
          {index === caretIndex && (
            <span
              aria-hidden
              className="absolute -left-px top-1/2 h-[1.2em] w-0.5 -translate-y-1/2 animate-caret bg-accent"
            />
          )}
          <span className={STATUS_CLASS[cell.status]}>
            {/* 공백도 한 글자로 판정한다. 오타난 공백은 글자가 안 보이므로 배경색으로 표시된다. */}
            {cell.char === ' ' ? ' ' : cell.char}
          </span>
        </span>
      ))}

      {/* 문장을 전부 정확히 친 경우 커서가 갈 자리가 없어지므로 문장 끝에 그려준다. */}
      {caretIndex >= cells.length && (
        <span
          aria-hidden
          className="ml-px inline-block h-[1.2em] w-0.5 translate-y-[0.2em] animate-caret bg-accent"
        />
      )}
    </p>
  )
}

/**
 * 화면에서 유일하게 보이는 입력 영역.
 * 실제 <input>은 숨겨져 있고(TypingInput 참고), 사용자가 보는 것은 이 컴포넌트뿐이다.
 *
 * 판정은 하지 않고 utils/charStatus.ts가 계산한 결과를 그리기만 한다.
 * 진행 상태는 오직 글자 색상으로만 표현한다. (밑줄·커서·배경 강조 없음)
 */
import { memo } from 'react'

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
  // 오타
  INCORRECT: 'text-typing-typo',
  // 조합 중이지만 자모가 목표와 맞게 가고 있는 글자 — 정타와 같은 파란색으로
  // 이어 보여야 "채워지는" 느낌이 끊기지 않는다.
  COMPOSING: 'text-typing-correct',
}

/**
 * memo로 감싸는 이유: 스톱워치·타수가 갱신될 때마다 이 무거운 글자 단위 렌더링까지
 * 다시 돌면 입력이 밀린다. 입력값이 실제로 바뀔 때만 다시 그리게 한다.
 */
export const SentenceDisplay = memo(function SentenceDisplay({
  sentence,
  input,
  isComposing,
}: SentenceDisplayProps) {
  const cells = getCharCells(sentence, input, isComposing)

  return (
    <p className="typing-sentence" aria-label={sentence}>
      {cells.map((cell, index) => (
        <span key={index} className={STATUS_CLASS[cell.status]}>
          {/* 공백도 한 글자로 판정한다. 줄바꿈 위치가 흔들리지 않도록 NBSP로 그린다. */}
          {cell.char === ' ' ? ' ' : cell.char}
        </span>
      ))}
    </p>
  )
})

/**
 * 화면에서 유일하게 보이는 입력 영역.
 * 실제 <input>은 숨겨져 있고(TypingInput 참고), 사용자가 보는 것은 이 컴포넌트뿐이다.
 *
 * 판정은 하지 않고 utils/charStatus.ts가 계산한 결과를 그리기만 한다.
 * 진행 상태는 오직 글자 색상으로만 표현한다. (밑줄·커서·배경 강조 없음)
 *
 * 문장은 어떤 길이·어떤 화면 폭에서도 절대 잘리면 안 된다.
 * 넘치면 줄바꿈하고, 그래도 넘치면 글자 크기가 줄어든다. 잘라내는 선택지는 없다.
 */
import { memo } from 'react'

import { getCharCells, groupCellsByWord } from '../utils/charStatus'
import type { CharCell } from '../utils/charStatus'

interface SentenceDisplayProps {
  sentence: string
  input: string
  isComposing: boolean
}

/** 글자 상태별 색상. 원색 유틸리티 대신 tailwind 토큰만 사용한다. */
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
  const chunks = groupCellsByWord(cells)

  return (
    // 프레임이 글자 크기와 최소 높이를 정한다. 1줄이든 2줄이든 세로 중심이 같은 자리에 온다.
    <div className="typing-sentence-frame">
      <p className="typing-sentence" aria-label={sentence}>
        {chunks.map((chunk, chunkIndex) => (
          // 어절은 nowrap으로 통째로 묶어 단어 중간에서 줄이 끊기지 않게 한다.
          // 공백 묶음은 그대로 둬서 줄바꿈이 일어날 수 있는 지점으로 남긴다.
          <span key={chunkIndex} className={chunk.isSpace ? undefined : 'whitespace-nowrap'}>
            {chunk.cells.map((cell) => (
              // 글자 span은 inline을 유지한다. inline-block이면 줄바꿈과 자간이 어색해진다.
              // 공백은 NBSP가 아닌 실제 공백으로 그려야 줄바꿈 지점이 된다.
              <span key={cell.index} className={STATUS_CLASS[cell.status]}>
                {cell.char}
              </span>
            ))}
          </span>
        ))}
      </p>
    </div>
  )
})

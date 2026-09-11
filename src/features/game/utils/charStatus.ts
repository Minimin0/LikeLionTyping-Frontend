/**
 * 제시 문장과 사용자 입력을 비교해 화면에 그릴 글자 셀을 만드는 순수 함수 모음.
 *
 * 표시 규칙:
 *   [표시 영역] = 사용자가 실제 입력한 텍스트(조합 중인 글자 포함) + 아직 안 친 목표 문장
 * 즉 이미 친 구간은 "목표 글자"가 아니라 "사용자가 실제로 친 글자"를 보여준다.
 * 그래야 ㅇ → 아 → 안 처럼 자모가 채워지는 과정이 그대로 눈에 보인다.
 *
 * 렌더링(SentenceDisplay)과 진행 가능 여부 판정(reducer)이 서로 다른 기준을 쓰면
 * 화면엔 다 맞았는데 Enter가 안 먹는 버그가 나므로, 두 곳 모두 이 파일만 사용한다.
 */
import { isHangulPrefix } from '@/shared/utils/hangul'

import type { CharCell } from '../types/game.types'

export function getCharCells(sentence: string, input: string, isComposing: boolean): CharCell[] {
  // 조합 중인 글자의 위치(항상 입력의 마지막 글자).
  const composingIndex = isComposing && input.length > 0 ? input.length - 1 : -1
  const cells: CharCell[] = []

  // 1) 이미 입력한 구간 — 사용자가 친 글자를 그대로 보여준다.
  for (let i = 0; i < input.length; i += 1) {
    const isOverflow = i >= sentence.length
    const targetChar = isOverflow ? '' : sentence[i]

    let status: CharCell['status']
    if (i === composingIndex) {
      // 조합 중인 글자는 아직 완성 전이라 통째로 비교하면 안 된다.
      // (목표가 '안'인데 'ㅇ'만 쳤다고 오타로 칠하면 정상 입력이 계속 빨갛게 깜빡인다)
      // 그래서 자모 단위로 "여기까지는 맞게 가고 있는가"만 본다.
      status = isHangulPrefix(targetChar, input[i]) ? 'COMPOSING' : 'INCORRECT'
    } else if (!isOverflow && input[i] === targetChar) {
      status = 'CORRECT'
    } else {
      // 글자가 다르거나, 문장 길이를 넘겨 친 경우
      status = 'INCORRECT'
    }

    cells.push({ char: input[i], status, isOverflow })
  }

  // 2) 아직 입력하지 않은 구간 — 목표 문장을 회색으로 보여준다.
  for (let i = input.length; i < sentence.length; i += 1) {
    cells.push({ char: sentence[i], status: 'PENDING', isOverflow: false })
  }

  return cells
}

/**
 * 현재 입력에 오타가 하나라도 있는지 여부.
 * 자모 단위로 진행 중인 글자(COMPOSING)는 오타로 잡지 않는다.
 */
export function hasTypo(sentence: string, input: string, isComposing: boolean): boolean {
  return getCharCells(sentence, input, isComposing).some((cell) => cell.status === 'INCORRECT')
}

/**
 * 다음 항목으로 넘어갈 수 있는지 판정한다.
 * 조합이 끝났고(isComposing === false) 입력이 목표와 완전히 같을 때만 true.
 */
export function canAdvance(sentence: string, input: string, isComposing: boolean): boolean {
  return !isComposing && input === sentence
}

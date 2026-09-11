/**
 * 제시 문장과 사용자 입력을 비교해 글자 단위 상태를 계산하는 순수 함수 모음.
 *
 * 렌더링(SentenceDisplay)과 "다음 문장으로 넘어가도 되는가" 판정(reducer)이
 * 서로 다른 기준을 쓰면 "화면엔 다 맞았는데 Enter가 안 먹는" 버그가 나기 때문에
 * 두 곳 모두 반드시 이 파일의 함수만 사용한다.
 */
import type { CharCell } from '../types/game.types'

/**
 * 문장을 글자 단위 셀 배열로 변환한다.
 * 배열 길이는 max(문장 길이, 입력 길이)이며, 초과 입력분도 셀로 만들어 화면에 노출한다.
 *
 * @param sentence 제시 문장
 * @param input 사용자가 현재까지 입력한 값
 * @param isComposing 한글 IME 조합 진행 여부
 */
export function getCharCells(sentence: string, input: string, isComposing: boolean): CharCell[] {
  // 조합 중인 글자의 위치(항상 입력의 마지막 글자).
  // 한글은 ㄱ → 가 → 각 처럼 한 글자가 여러 단계를 거치므로, 조합이 끝나기 전에
  // 비교하면 정상적으로 치고 있는 글자가 계속 빨갛게 깜빡인다. 그래서 판정을 보류한다.
  const composingIndex = isComposing && input.length > 0 ? input.length - 1 : -1

  const length = Math.max(sentence.length, input.length)
  const cells: CharCell[] = []

  for (let i = 0; i < length; i += 1) {
    const isOverflow = i >= sentence.length
    // 초과 입력분은 제시 문장에 대응하는 글자가 없으므로 사용자가 친 글자를 그대로 보여준다.
    const char = isOverflow ? input[i] : sentence[i]

    let status: CharCell['status']
    if (i === composingIndex) {
      // 조합 중 → 아직 판정하지 않음
      status = 'COMPOSING'
    } else if (i >= input.length) {
      // 아직 입력이 도달하지 않은 위치 → 미입력
      status = 'PENDING'
    } else if (!isOverflow && input[i] === sentence[i]) {
      // 같은 위치의 글자가 일치 → 정타
      status = 'CORRECT'
    } else {
      // 글자가 다르거나, 문장 길이를 넘겨 친 경우 → 오타
      status = 'INCORRECT'
    }

    cells.push({ char, status, isOverflow })
  }

  return cells
}

/**
 * 현재 입력에 오타가 하나라도 있는지 여부.
 * 조합 중인 마지막 글자는 판정 대상에서 제외되므로 오타로 잡히지 않는다.
 */
export function hasTypo(sentence: string, input: string, isComposing: boolean): boolean {
  return getCharCells(sentence, input, isComposing).some((cell) => cell.status === 'INCORRECT')
}

/**
 * 다음 문장으로 넘어갈 수 있는지 판정한다.
 * 조합이 끝났고(isComposing === false) 입력이 문장과 완전히 같을 때만 true.
 */
export function canAdvance(sentence: string, input: string, isComposing: boolean): boolean {
  return !isComposing && input === sentence
}

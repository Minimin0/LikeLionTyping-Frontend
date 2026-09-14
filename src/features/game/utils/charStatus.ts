/**
 * 제시 문장과 사용자 입력을 비교해 화면에 그릴 글자 셀을 만드는 순수 함수 모음.
 *
 * 표시 규칙:
 *   [표시 영역] = 사용자가 실제 입력한 텍스트(조합 중인 글자 포함) + 아직 안 친 목표 문장
 * 즉 이미 친 구간은 "목표 글자"가 아니라 "사용자가 실제로 친 글자"를 보여준다.
 * 그래야 ㅇ → 아 → 안 처럼 자모가 채워지는 과정이 그대로 눈에 보인다.
 *
 * 렌더링(SentenceDisplay)과 진행 가능 여부 판정이 서로 다른 기준을 쓰면
 * 화면엔 다 맞았는데 Enter가 안 먹는 버그가 나므로, 두 곳 모두 이 파일만 사용한다.
 */
import { isHangulPrefix } from '../../../shared/utils/hangul'

/**
 * 문장 안 글자 1개의 판정 상태.
 * - PENDING:   아직 입력하지 않음 (회색)
 * - CORRECT:   정타 (파랑)
 * - INCORRECT: 오타 (빨강 + 강조)
 * - COMPOSING: 한글 조합 중이라 아직 판정하지 않음 (연한 파랑)
 */
export type CharStatus = 'PENDING' | 'CORRECT' | 'INCORRECT' | 'COMPOSING'

/** 문장 렌더링용 글자 단위 셀 */
export interface CharCell {
  /** 화면에 그릴 글자. 초과 입력분은 사용자가 실제로 친 글자를 보여준다. */
  char: string
  status: CharStatus
  /** 제시 문장 길이를 넘어선 입력분인지 여부 */
  isOverflow: boolean
}

export function getCharCells(sentence: string, input: string, isComposing: boolean): CharCell[] {
  // 조합 중인 글자의 위치(항상 입력의 마지막 글자).
  const composingIndex = isComposing && input.length > 0 ? input.length - 1 : -1
  const cells: CharCell[] = []

  // 1) 이미 입력한 구간 — 사용자가 친 글자를 그대로 보여준다.
  for (let i = 0; i < input.length; i += 1) {
    const isOverflow = i >= sentence.length
    const targetChar = isOverflow ? '' : sentence[i]
    const inputChar = input[i]
    let displayChar = inputChar

    let status: CharCell['status']
    if (i === composingIndex) {
      // 조합 중인 글자는 아직 완성 전이라 통째로 비교하면 안 된다.
      // (목표가 '안'인데 'ㅇ'만 쳤다고 오타로 칠하면 정상 입력이 계속 빨갛게 깜빡인다)
      // 그래서 자모 단위로 "여기까지는 맞게 가고 있는가"만 본다.
      status = isHangulPrefix(targetChar, inputChar) ? 'COMPOSING' : 'INCORRECT'
    } else if (!isOverflow && inputChar === targetChar) {
      status = 'CORRECT'
    } else {
      // 글자가 다르거나, 문장 길이를 넘겨 친 경우
      status = 'INCORRECT'

      // 목표는 글자인데 스페이스바를 잘못 눌러 공백이 들어온 경우, 공백은
      // 글리프가 없어 배경색이 없으면 오타 자체가 안 보인다. 이때만 예외적으로
      // 사용자가 친 공백 대신 원래 쳤어야 할 목표 글자를 보여준다.
      // (반대로 목표가 공백인데 다른 글자를 친 경우는 그 글자가 이미 눈에
      // 보이므로 원래대로 입력한 글자를 보여준다)
      if (!isOverflow && inputChar === ' ' && targetChar !== ' ') {
        displayChar = targetChar
      }
    }

    cells.push({ char: displayChar, status, isOverflow })
  }

  // 2) 아직 입력하지 않은 구간 — 목표 문장을 회색으로 보여준다.
  for (let i = input.length; i < sentence.length; i += 1) {
    cells.push({ char: sentence[i], status: 'PENDING', isOverflow: false })
  }

  return cells
}

/** 원본 문장에서의 위치가 붙은 셀. 색상 판정은 이 index 기준이므로 절대 어긋나면 안 된다. */
export interface IndexedCell extends CharCell {
  index: number
}

/** 어절(공백이 아닌 글자 묶음) 또는 공백 묶음 */
export interface CellChunk {
  isSpace: boolean
  cells: IndexedCell[]
}

/**
 * 글자 셀을 어절 단위로 묶는다.
 *
 * 글자마다 <span>으로 쪼개 그리면 브라우저가 각 span을 독립된 단위로 보기 때문에
 * word-break: keep-all이 어절을 지켜주지 못하고 "있습니 / 다"처럼 단어 중간에서 줄이 끊긴다.
 * 어절을 nowrap span으로 한 번 더 감싸야 어절 단위로 줄바꿈된다.
 *
 * 공백도 별도 묶음으로 유지한다. 공백은 줄바꿈이 일어날 수 있는 지점이면서
 * 동시에 오타 판정 대상이므로 렌더링에서 빠뜨리면 안 된다.
 */
export function groupCellsByWord(cells: CharCell[]): CellChunk[] {
  const chunks: CellChunk[] = []

  cells.forEach((cell, index) => {
    const isSpace = /\s/.test(cell.char)
    const last = chunks[chunks.length - 1]

    if (last && last.isSpace === isSpace) {
      last.cells.push({ ...cell, index })
    } else {
      chunks.push({ isSpace, cells: [{ ...cell, index }] })
    }
  })

  return chunks
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

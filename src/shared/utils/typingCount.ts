/**
 * 두벌식 자판 기준 "실제로 눌러야 하는 키 개수"를 세는 유틸.
 *
 * 한글 한 글자는 1타가 아니다. '안'은 ㅇ + ㅏ + ㄴ 세 번을 눌러야 하므로 3타다.
 * 그래서 글자 수가 아니라 초성/중성/종성 각각의 키 수를 합산한다.
 */

const HANGUL_BASE = 0xac00
const HANGUL_END = 0xd7a3

/**
 * 초성 19개의 타건 수.
 * 쌍자음(ㄲ ㄸ ㅃ ㅆ ㅉ)은 Shift를 함께 눌러야 하므로 2타로 센다.
 */
// prettier-ignore
const CHO_COST = [
  //ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ
     1, 2, 1, 2, 1, 1, 1, 1, 2, 1,
  //ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
     2, 1, 2, 1, 1, 1, 1, 1, 1,
]

/**
 * 중성 21개의 타건 수.
 * 복합모음(ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ)은 모음 두 개를 이어 눌러야 하고,
 * ㅒ ㅖ 는 Shift가 필요하므로 2타로 센다.
 */
// prettier-ignore
const JUNG_COST = [
  //ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ
     1, 1, 1, 2, 1, 1, 1, 2, 1, 2,
  //ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
     2, 2, 1, 1, 2, 2, 2, 1, 1, 2, 1,
]

/**
 * 종성 28개의 타건 수. (0번은 받침 없음)
 * 겹받침(ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ)은 자음 두 개를 이어 눌러야 하고,
 * ㄲ ㅆ 은 Shift가 필요하므로 2타로 센다.
 */
// prettier-ignore
const JONG_COST = [
  //없 ㄱ ㄲ ㄳ ㄴ ㄵ ㄶ ㄷ ㄹ ㄺ
     0, 1, 2, 2, 1, 2, 2, 1, 1, 2,
  //ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅁ ㅂ ㅄ ㅅ
     2, 2, 2, 2, 2, 2, 1, 1, 2, 1,
  //ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ
     2, 1, 1, 1, 1, 1, 1, 1,
]

/** 문자 하나의 타건 수를 반환한다. */
export function countKeystrokes(char: string): number {
  const code = char.charCodeAt(0)

  // 완성형 한글: 유니코드 계산식을 역산해 초성/중성/종성으로 나눈 뒤 키 수를 더한다.
  if (code >= HANGUL_BASE && code <= HANGUL_END) {
    const offset = code - HANGUL_BASE
    const jong = offset % 28
    const jung = Math.floor(offset / 28) % 21
    const cho = Math.floor(offset / 588)
    return CHO_COST[cho] + JUNG_COST[jung] + JONG_COST[jong]
  }

  // 단독 자모(ㄱ, ㅏ 등 IME 조합 중인 글자)는 키 하나에 대응하므로 1타다.
  if (code >= 0x3131 && code <= 0x318e) return 1

  // 영문 대문자와 Shift가 필요한 특수문자는 2타
  if (/[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(char)) return 2

  // 그 외(영문 소문자, 숫자, 공백, 일반 기호)는 1타
  return 1
}

/** 문자열 전체의 타건 수를 반환한다. */
export function countKeystrokesOfText(text: string): number {
  let total = 0
  for (const char of text) total += countKeystrokes(char)
  return total
}

/**
 * 목표 문장과 입력값을 비교해, 앞에서부터 일치하는 구간의 타건 수만 센다.
 *
 * 첫 오타에서 멈추는 이유: 오타·백스페이스·초과 입력까지 타건으로 세면
 * 아무렇게나 두들겨도 타수가 올라가 기록이 부풀려진다.
 * 오타를 고치는 동안에는 타건이 늘지 않고 시간만 흐르므로 타수가 자연히 내려간다.
 */
export function countMatchedKeystrokes(target: string, input: string): number {
  let total = 0
  const length = Math.min(target.length, input.length)

  for (let i = 0; i < length; i += 1) {
    if (target[i] !== input[i]) break
    total += countKeystrokes(target[i])
  }

  return total
}

/**
 * 한글 자모 분해 유틸.
 * 타자게임에서 "조합 중인 글자가 목표 글자를 향해 제대로 가고 있는지"를
 * 완성된 글자가 아니라 자모 단위로 판정하기 위해 사용한다.
 */

/** 한글 음절 영역 시작점 ('가') */
const HANGUL_BASE = 0xac00
/** 한글 음절 개수 ('가' ~ '힣') */
const HANGUL_COUNT = 11172

/** 초성 19자 (인덱스 = 유니코드 계산식의 초성 번호) */
const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
/** 중성 21자 */
const JUNGSEONG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'

/**
 * 자리(초성/중성/종성)별 오프셋.
 *
 * 초성 'ㄱ'과 중성 'ㅏ'는 둘 다 인덱스 0이다. 오프셋 없이 숫자만 비교하면
 * 'ㅏ'를 친 것이 'ㄱ'으로 시작하는 글자의 진행으로 잘못 인정된다.
 * 자리마다 다른 숫자 구간을 쓰면 이런 교차 오인식이 생기지 않는다.
 */
const JUNG_OFFSET = 1000
const JONG_OFFSET = 2000
const NON_HANGUL_OFFSET = 100000

/**
 * 글자 하나를 자모 인덱스 배열로 분해한다.
 *
 * 유니코드상 한글 음절 = 0xAC00 + (초성 * 21 + 중성) * 28 + 종성 이므로,
 * 이 식을 역산해서 초성/중성/종성을 뽑아낸다.
 * 종성이 없으면 [초성, 중성] 두 칸만 반환해서 "아직 종성이 안 들어온 상태"와
 * 자연스럽게 앞부분 비교가 되도록 한다.
 */
export function decomposeHangul(char: string): number[] {
  const code = char.charCodeAt(0) - HANGUL_BASE

  if (code >= 0 && code < HANGUL_COUNT) {
    const jong = code % 28
    const jung = Math.floor(code / 28) % 21
    const cho = Math.floor(code / 588)
    return jong === 0 ? [cho, JUNG_OFFSET + jung] : [cho, JUNG_OFFSET + jung, JONG_OFFSET + jong]
  }

  // 단독 자모('ㅇ', 'ㅏ')는 완성형 한글이 아니라 위 계산식에 걸리지 않는다.
  // IME 조합의 첫 단계가 바로 이 상태이므로, 여기서 "초성만 입력됨" /
  // "중성만 입력됨"으로 인식해줘야 자모 단위 진행 판정이 동작한다.
  const choIndex = CHOSEONG.indexOf(char)
  if (choIndex >= 0) return [choIndex]

  const jungIndex = JUNGSEONG.indexOf(char)
  if (jungIndex >= 0) return [JUNG_OFFSET + jungIndex]

  // 영문/숫자/공백/기호는 분해 대상이 아니므로 글자 하나를 그대로 한 단위로 쓴다.
  return [NON_HANGUL_OFFSET + char.charCodeAt(0)]
}

/**
 * 입력 중인 글자가 목표 글자의 "앞부분까지 맞게" 진행 중인지 판정한다.
 *
 * 예) 목표 '안'(ㅇ+ㅏ+ㄴ), 입력 'ㅇ' → 초성 일치 → true  (아직 오타가 아니다)
 *     목표 '안',           입력 'ㄱ' → 초성 불일치 → false (오타)
 *     목표 '아'(ㅇ+ㅏ),    입력 '안' → 목표보다 길다 → false (오타)
 */
export function isHangulPrefix(target: string, input: string): boolean {
  if (!target || !input) return false

  const targetJamo = decomposeHangul(target)
  const inputJamo = decomposeHangul(input)
  if (inputJamo.length > targetJamo.length) return false

  return inputJamo.every((jamo, index) => jamo === targetJamo[index])
}

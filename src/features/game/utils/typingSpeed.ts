/**
 * 타수(타/분) 계산.
 *
 * 이 값은 화면 표시 전용이다. 랭킹 기준은 오직 elapsedMs이며,
 * 타수는 백엔드로 보내지 않는다. (API 명세서에 없는 필드)
 */

/**
 * 타수를 계산하기 시작하는 최소 경과 시간.
 * 시작 직후에는 경과 시간이 0에 가까워 나눗셈 결과가 Infinity가 되거나
 * 몇 만 타 같은 비정상적인 값이 잠깐 스쳐 지나간다.
 */
export const MIN_ELAPSED_MS_FOR_CPM = 500

/**
 * 타수(타/분) = 누적 타건 수 ÷ (경과 시간(ms) ÷ 60000)
 *
 * @param keystrokes 정확히 입력된 구간의 누적 타건 수
 * @param elapsedMs performance.now() 기준으로 잰 경과 시간
 */
export function calculateCpm(keystrokes: number, elapsedMs: number): number {
  if (elapsedMs < MIN_ELAPSED_MS_FOR_CPM) return 0
  return Math.round(keystrokes / (elapsedMs / 60000))
}

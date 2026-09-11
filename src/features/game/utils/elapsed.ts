/**
 * 공식 기록(elapsedMs) 계산.
 *
 * 반드시 performance.now() 기준의 두 시각을 받는다.
 * Date.now()를 쓰지 않는 이유: 시스템 시간 변경이나 NTP 보정이 발생하면 값이 뒤로
 * 점프할 수 있어 기록이 음수가 되거나 실제보다 짧게 찍힐 수 있다.
 * performance.now()는 단조 증가(monotonic)라 경과 시간 측정에 안전하다.
 */

/**
 * @param startTimeMs 카운트다운이 끝난 순간의 performance.now()
 * @param endTimeMs 마지막 문장 입력을 완료한 순간의 performance.now()
 * @returns Backend로 보낼 정수 millisecond (43.821초 → 43821)
 */
export function calculateElapsedMs(startTimeMs: number, endTimeMs: number): number {
  return Math.max(0, Math.round(endTimeMs - startTimeMs))
}

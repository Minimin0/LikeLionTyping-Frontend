/**
 * 기록(ms)을 화면 표시용 문자열로 변환한다.
 * 여기서 만든 문자열은 오직 표시용이며, Backend로 보내는 공식 기록은 항상 정수 ms다.
 */

/**
 * 43821 → "43.821", 63821 → "01:03.821"
 * 1분 미만이면 초 단위로만 표시해 부스 화면에서 읽기 쉽게 한다.
 */
export function formatElapsedMs(ms: number): string {
  const safe = Math.max(0, Math.round(ms))
  const totalSeconds = Math.floor(safe / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const millis = String(safe % 1000).padStart(3, '0')

  if (minutes > 0) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${millis}`
  }
  return `${String(seconds).padStart(2, '0')}.${millis}`
}

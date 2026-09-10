// Raw contract value (elapsedMs, per AGENTS.md). Kept for any screen that
// needs to show the official completion time as-is.
export function formatElapsedMs(ms) {
  if (ms == null) return '-'
  return `${(ms / 1000).toFixed(3)}초`
}

// Typing speed in "타" (characters per minute), the unit staff actually
// asked for instead of raw seconds. The number itself is computed
// server-side (mocked in adminApi.calculateTypingSpeed for now).
export function formatTypingSpeed(typingSpeed) {
  if (typingSpeed == null) return '-'
  return `${typingSpeed}타`
}

export function formatDateTime(isoString) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Only formats a normalized 11-digit KR mobile number (01012345678 ->
// 010-1234-5678). Anything else (null, wrong length) is returned as-is
// or as '-' so callers don't need their own null guard.
export function formatPhone(phone) {
  if (!phone) return '-'
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
}

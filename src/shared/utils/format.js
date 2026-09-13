// Raw contract value (elapsedMs, per AGENTS.md). Games finish inside a
// minute, so plain seconds (no 분/초 split) is the right unit here.
export function formatElapsedMs(ms) {
  if (ms == null) return '-'
  return `${(ms / 1000).toFixed(3)}초`
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

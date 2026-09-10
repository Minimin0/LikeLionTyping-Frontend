export function formatElapsedMs(ms) {
  if (ms == null) return '-'
  return `${(ms / 1000).toFixed(3)}초`
}

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

export function formatPhone(phone) {
  if (!phone) return '-'
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
}

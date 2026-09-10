// Korean labels for every PlayPass status (AVAILABLE/CONSUMED/CANCELLED)
// and GameSession status (IN_PROGRESS/COMPLETED/INVALIDATED) from the
// AGENTS.md data model. IN_PROGRESS/COMPLETED use the radio-show framing
// ("ON AIR" / "방송 완료") to match the service's on-air concept.
const LABELS = {
  FREE: '무료',
  PAID: '유료',
  AVAILABLE: '사용 가능',
  CONSUMED: '사용됨',
  CANCELLED: '취소됨',
  IN_PROGRESS: 'ON AIR',
  COMPLETED: '방송 완료',
  INVALIDATED: '무효 처리',
}

// Shared pill badge for pass/session status, colored via CSS class
// badge--<status-lowercased> (see admin.css).
function StatusBadge({ status }) {
  const key = status.toLowerCase()
  const label = LABELS[status] ?? status
  return <span className={`badge badge--${key}`}>{label}</span>
}

export default StatusBadge

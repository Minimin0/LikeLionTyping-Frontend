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

function StatusBadge({ status }) {
  const key = status.toLowerCase()
  const label = LABELS[status] ?? status
  return <span className={`badge badge--${key}`}>{label}</span>
}

export default StatusBadge

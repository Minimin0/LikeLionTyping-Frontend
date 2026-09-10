import { useEffect, useState } from 'react'
import { getRegistrationStatus, setRegistrationStatus } from '../api/adminApi'

// 마감 관리: lets staff stop taking new payments/retries near the end of
// the event (long queue, running out of time) without touching in-flight
// games — those still finish and count toward the final ranking.
function OperationsPanel() {
  const [open, setOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getRegistrationStatus().then((status) => {
      setOpen(status.open)
      setIsLoading(false)
    })
  }, [])

  async function handleToggle() {
    setIsSaving(true)
    const next = !open
    const result = await setRegistrationStatus(next)
    setOpen(result.open)
    setIsSaving(false)
  }

  return (
    <div className="admin-panel">
      <h2 className="admin-panel__title">접수 마감 관리</h2>
      <p className="admin-panel__hint">
        남은 운영 시간과 대기 인원을 고려해 결제 접수를 마감합니다. 이미 결제한 참가자는 경기를 마친 뒤 최종 순위를
        확정합니다.
      </p>
      <div className="toggle-row">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {isLoading ? '상태 확인 중…' : open ? '현재 결제 접수 중' : '결제 접수 마감됨'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
            {open ? '신규 참가자와 재도전 결제를 받고 있습니다.' : '신규 결제를 받지 않습니다. 진행 중인 경기만 마무리하세요.'}
          </div>
        </div>
        <button
          type="button"
          aria-label="접수 마감 토글"
          className={`toggle-switch ${open ? 'toggle-switch--on' : ''}`}
          disabled={isLoading || isSaving}
          onClick={handleToggle}
        >
          <span className="toggle-switch__knob" />
        </button>
      </div>
    </div>
  )
}

export default OperationsPanel

import { useState } from 'react'
import {
  cancelPass,
  invalidateGameSession,
  issuePaidPass,
  restorePassById,
  searchParticipantByPhone,
  updateParticipantPhone,
} from '../api/adminApi'
import { formatDateTime, formatPhone, formatTypingSpeed } from '../../../shared/utils/format'
import StatusBadge from './StatusBadge'

// One row per game session. Every destructive action in this file (here
// and in PassRow/PhoneEditForm below) uses the same two-step pattern —
// a first click only reveals a confirm row, a second click actually
// calls the API — so a stray tap during a busy festival shift can't
// invalidate a match or refund a pass by accident.
function GameSessionRow({ session, onInvalidated }) {
  const [confirming, setConfirming] = useState(false)
  const [restorePass, setRestorePass] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canInvalidate = session.status === 'IN_PROGRESS' || session.status === 'COMPLETED'

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    try {
      const result = await invalidateGameSession(session.id, restorePass)
      onInvalidated(result)
      setConfirming(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <tr>
      <td data-label="채널">{session.category?.name ?? '-'}</td>
      <td data-label="상태">
        <StatusBadge status={session.status} />
      </td>
      <td data-label="기록">{formatTypingSpeed(session.typingSpeed)}</td>
      <td data-label="시작 시각">{formatDateTime(session.startedAt)}</td>
      <td data-label="처리">
        {!canInvalidate && <span style={{ color: 'var(--admin-text-muted)', fontSize: 12.5 }}>-</span>}
        {canInvalidate && !confirming && (
          <button type="button" className="btn btn--danger btn--sm" onClick={() => setConfirming(true)}>
            경기 무효 처리
          </button>
        )}
        {canInvalidate && confirming && (
          <div className="invalidate-row">
            <label>
              <input
                type="checkbox"
                checked={restorePass}
                onChange={(event) => setRestorePass(event.target.checked)}
              />
              이용권 복구
            </label>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              disabled={isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? '처리 중…' : '무효 확정'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>
              취소
            </button>
          </div>
        )}
        {error && <p className="admin-error" style={{ margin: '6px 0 0' }}>{error}</p>}
      </td>
    </tr>
  )
}

// One row per pass. Which action is offered depends entirely on
// pass.status: AVAILABLE -> can be cancelled/refunded (paid-but-unused),
// CONSUMED -> can be restored (fixes a double-charge), CANCELLED -> no
// action. A pass can never go directly from CANCELLED back to AVAILABLE.
function PassRow({ pass, onChanged }) {
  const [confirming, setConfirming] = useState(null) // 'cancel' | 'restore' | null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel() {
    setIsSubmitting(true)
    setError('')
    try {
      await cancelPass(pass.id)
      await onChanged('취소된 이용권을 회수했습니다. 유료 이용권이었다면 현장에서 500원을 환불해주세요.')
      setConfirming(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRestore() {
    setIsSubmitting(true)
    setError('')
    try {
      await restorePassById(pass.id)
      await onChanged('중복 차감된 이용권을 복구했습니다.')
      setConfirming(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <tr>
      <td data-label="종류">
        <span className={`badge badge--${pass.type.toLowerCase()}`}>{pass.type === 'FREE' ? '무료' : '유료'}</span>
      </td>
      <td data-label="상태">
        <StatusBadge status={pass.status} />
      </td>
      <td data-label="발급일">{formatDateTime(pass.createdAt)}</td>
      <td data-label="처리">
        {pass.status === 'CANCELLED' && <span style={{ color: 'var(--admin-text-muted)', fontSize: 12.5 }}>-</span>}

        {pass.status === 'AVAILABLE' && confirming !== 'cancel' && (
          <button type="button" className="btn btn--danger btn--sm" onClick={() => setConfirming('cancel')}>
            취소 · 환불
          </button>
        )}
        {pass.status === 'AVAILABLE' && confirming === 'cancel' && (
          <div className="invalidate-row">
            <span style={{ fontSize: 12.5, color: 'var(--admin-text-muted)' }}>
              {pass.type === 'PAID' ? '500원 환불 후 회수할까요?' : '미사용 이용권을 회수할까요?'}
            </span>
            <button type="button" className="btn btn--danger btn--sm" disabled={isSubmitting} onClick={handleCancel}>
              {isSubmitting ? '처리 중…' : '회수 확정'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(null)}>
              취소
            </button>
          </div>
        )}

        {pass.status === 'CONSUMED' && confirming !== 'restore' && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming('restore')}>
            중복 차감 복구
          </button>
        )}
        {pass.status === 'CONSUMED' && confirming === 'restore' && (
          <div className="invalidate-row">
            <span style={{ fontSize: 12.5, color: 'var(--admin-text-muted)' }}>
              추가 결제 없이 이용권을 복구할까요?
            </span>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={isSubmitting}
              onClick={handleRestore}
            >
              {isSubmitting ? '처리 중…' : '복구 확정'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(null)}>
              취소
            </button>
          </div>
        )}
        {error && <p className="admin-error" style={{ margin: '6px 0 0' }}>{error}</p>}
      </td>
    </tr>
  )
}

// Corrects a mistyped participant phone number. The identity checkbox is
// a deliberate manual gate — per the Notion spec, staff must verify the
// participant's identity before editing the number that their whole
// history (free-play eligibility, records, prize contact) is keyed on.
function PhoneEditForm({ participant, onUpdated, onCancel }) {
  const [newPhone, setNewPhone] = useState(participant.phone)
  const [confirmedIdentity, setConfirmedIdentity] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!confirmedIdentity) {
      setError('본인 확인 체크 후 수정할 수 있습니다.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await updateParticipantPhone(participant.id, newPhone)
      await onUpdated(newPhone)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="invalidate-row" onSubmit={handleSubmit} style={{ marginTop: 4 }}>
      <input
        type="tel"
        value={newPhone}
        onChange={(event) => setNewPhone(event.target.value)}
        placeholder="새 전화번호"
        style={{
          background: 'var(--admin-surface-alt)',
          border: '1px solid var(--admin-border)',
          borderRadius: 8,
          padding: '6px 10px',
          color: 'var(--admin-text)',
          fontSize: 12.5,
          width: 140,
        }}
      />
      <label>
        <input
          type="checkbox"
          checked={confirmedIdentity}
          onChange={(event) => setConfirmedIdentity(event.target.checked)}
        />
        본인 확인함
      </label>
      <button type="submit" className="btn btn--primary btn--sm" disabled={isSubmitting}>
        {isSubmitting ? '수정 중…' : '전화번호 수정'}
      </button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
        취소
      </button>
      {error && <p className="admin-error" style={{ margin: '6px 0 0', width: '100%' }}>{error}</p>}
    </form>
  )
}

// Everything staff can see/do for one looked-up participant: pass
// issuance, the pass table, and the game-session table. After any
// mutation (issue/cancel/restore/invalidate/phone edit) we re-fetch the
// participant via refresh() rather than patching local state by hand —
// simpler to keep correct, and it's how this will behave once refresh()
// is a real GET call anyway.
function ParticipantResultCard({ result, onUpdate }) {
  const { participant, passes, sessions } = result
  const [issuing, setIssuing] = useState(false)
  const [confirmingIssue, setConfirmingIssue] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [toast, setToast] = useState(null)

  const availablePassCount = passes.filter((pass) => pass.status === 'AVAILABLE').length

  async function refresh(phone) {
    const refreshed = await searchParticipantByPhone(phone ?? participant.phone)
    onUpdate(refreshed)
  }

  async function handleIssuePass() {
    setIssuing(true)
    setToast(null)
    try {
      await issuePaidPass(participant.id)
      await refresh()
      setToast({ type: 'success', message: '500원 결제 확인 완료 · PAID 이용권 1회가 발급되었습니다.' })
      setConfirmingIssue(false)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setIssuing(false)
    }
  }

  async function handleInvalidated() {
    await refresh()
    setToast({ type: 'success', message: '경기 무효 처리가 완료되었습니다.' })
  }

  async function handlePassChanged(message) {
    await refresh()
    setToast({ type: 'success', message })
  }

  async function handlePhoneUpdated(newPhone) {
    await refresh(newPhone)
    setToast({ type: 'success', message: '전화번호가 수정되었습니다.' })
    setEditingPhone(false)
  }

  return (
    <div className="participant-card">
      <div className="participant-card__head">
        <div>
          <div className="participant-card__name">{participant.nickname}</div>
          <div className="participant-card__phone" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {formatPhone(participant.phone)}
            {!editingPhone && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingPhone(true)}>
                번호 수정
              </button>
            )}
          </div>
          {editingPhone && (
            <PhoneEditForm
              participant={participant}
              onUpdated={handlePhoneUpdated}
              onCancel={() => setEditingPhone(false)}
            />
          )}
        </div>
        {!confirmingIssue && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setConfirmingIssue(true)}>
            PAID 이용권 발급
          </button>
        )}
        {confirmingIssue && (
          <div className="invalidate-row">
            <span style={{ fontSize: 12.5, color: 'var(--admin-text-muted)' }}>
              '{participant.nickname}'님 500원 결제를 확인했나요?
            </span>
            <button type="button" className="btn btn--primary btn--sm" disabled={issuing} onClick={handleIssuePass}>
              {issuing ? '발급 중…' : '결제 확인 · 발급'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmingIssue(false)}>
              취소
            </button>
          </div>
        )}
      </div>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div style={{ marginTop: 16 }}>
        <span className="badge badge--available">사용 가능 이용권 {availablePassCount}개</span>
        <table style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>종류</th>
              <th>상태</th>
              <th>발급일</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {passes.map((pass) => (
              <PassRow key={pass.id} pass={pass} onChanged={handlePassChanged} />
            ))}
          </tbody>
        </table>
      </div>

      <table style={{ marginTop: 18 }}>
        <thead>
          <tr>
            <th>채널</th>
            <th>상태</th>
            <th>기록</th>
            <th>시작 시각</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                경기 기록이 없습니다.
              </td>
            </tr>
          )}
          {sessions.map((session) => (
            <GameSessionRow key={session.id} session={session} onInvalidated={handleInvalidated} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Entry point for the "참가자 조회" tab: a phone-number search box that
// renders a ParticipantResultCard once a match is found.
function ParticipantLookupPanel() {
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  async function handleSearch(event) {
    event.preventDefault()
    setError('')
    setIsSearching(true)
    try {
      const data = await searchParticipantByPhone(phone)
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  // Keeps the search box in sync after a phone-number edit, so a
  // follow-up search (or a re-render) uses the corrected number.
  function handleUpdate(data) {
    setResult(data)
    setPhone(data.participant.phone)
  }

  return (
    <div className="admin-panel">
      <h2 className="admin-panel__title">참가자 조회</h2>
      <p className="admin-panel__hint">
        전화번호로 무료 참여 여부, 이용권, 경기 기록을 확인합니다. (데모용 전화번호: 010-1234-5678)
      </p>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="01012345678"
        />
        <button type="submit" className="btn btn--primary" disabled={isSearching || !phone}>
          {isSearching ? '조회 중…' : '조회'}
        </button>
      </form>
      {error && <p className="admin-error" style={{ marginTop: 12 }}>{error}</p>}
      {result && <ParticipantResultCard result={result} onUpdate={handleUpdate} />}
    </div>
  )
}

export default ParticipantLookupPanel

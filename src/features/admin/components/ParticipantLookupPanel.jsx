import { useState } from 'react'
import { invalidateGameSession, issuePaidPass, searchParticipantByPhone } from '../api/adminApi'
import { formatDateTime, formatElapsedMs, formatPhone } from '../../../shared/utils/format'
import StatusBadge from './StatusBadge'

// One row per game session. Invalidate uses a two-step pattern — a first
// click only reveals a confirm row, a second click actually calls the API
// — so a stray tap during a busy festival shift can't invalidate a match
// by accident.
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
      <td data-label="기록">{formatElapsedMs(session.elapsedMs)}</td>
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

// Read-only: per the locked admin scope, no pass-level action exists
// outside of invalidateGameSession's restore (GameSessionRow above).
// Standalone cancel/refund/restore and phone edit are explicitly out of
// scope — see [[project-typing-admin-page]].
function PassRow({ pass }) {
  return (
    <tr>
      <td data-label="종류">
        <span className={`badge badge--${pass.type.toLowerCase()}`}>{pass.type === 'FREE' ? '무료' : '유료'}</span>
      </td>
      <td data-label="상태">
        <StatusBadge status={pass.status} />
      </td>
      <td data-label="발급일">{formatDateTime(pass.createdAt)}</td>
    </tr>
  )
}

// Everything staff can see/do for one looked-up participant: pass
// issuance, the pass table, and the game-session table. After any
// mutation (issue/invalidate) we re-fetch the participant via refresh()
// rather than patching local state by hand.
function ParticipantResultCard({ result, onUpdate }) {
  const { participant, passes, sessions } = result
  const [issuing, setIssuing] = useState(false)
  const [confirmingIssue, setConfirmingIssue] = useState(false)
  const [toast, setToast] = useState(null)

  const availablePassCount = passes.filter((pass) => pass.status === 'AVAILABLE').length

  async function refresh() {
    const refreshed = await searchParticipantByPhone(participant.phone)
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

  return (
    <div className="participant-card">
      <div className="participant-card__head">
        <div>
          <div className="participant-card__name">{participant.nickname}</div>
          <div className="participant-card__phone">{formatPhone(participant.phone)}</div>
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
            </tr>
          </thead>
          <tbody>
            {passes.map((pass) => (
              <PassRow key={pass.id} pass={pass} />
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
      {result && <ParticipantResultCard result={result} onUpdate={setResult} />}
    </div>
  )
}

export default ParticipantLookupPanel

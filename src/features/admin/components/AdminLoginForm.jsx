import { useState } from 'react'
import { adminLogin } from '../api/adminApi'

// Staff-only login gate shown before AdminDashboard. Password value never
// touches this component's state after submit — it's handed straight to
// adminLogin(), which is the single place that knows how the real backend
// wants to verify it (Bearer token vs. session cookie, per AGENTS.md).
function AdminLoginForm({ onLoginSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await adminLogin(password)
      onLoginSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <span className="admin-login__onair">
          <span className="admin-login__onair-dot" />
          ON AIR · STAFF ONLY
        </span>
        <h1 className="admin-login__title">운영진 로그인</h1>
        <p className="admin-login__subtitle">
          멋쟁이 타자처럼 현장 운영 콘솔입니다. 관리자 비밀번호로 로그인하세요.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="admin-password">관리자 비밀번호</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호 입력"
            />
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
            {isSubmitting ? '확인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginForm

import { useNavigate } from 'react-router-dom'
import './landing.css'

// Front door for the festival booth kiosk. Staff tap "운영진" to go
// straight into the admin console (no login gate — see AdminPage).
function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-shell">
      <div className="landing-onair">
        <span className="landing-onair-dot" />
        ON AIR
      </div>
      <h1 className="landing-title">멋쟁이 타자처럼</h1>
      <p className="landing-subtitle">라디오 부스에 오신 걸 환영합니다.</p>

      <div className="landing-actions">
        <button
          type="button"
          className="landing-btn landing-btn--primary"
          onClick={() => navigate('/admin')}
        >
          운영진
        </button>
      </div>
    </div>
  )
}

export default LandingPage

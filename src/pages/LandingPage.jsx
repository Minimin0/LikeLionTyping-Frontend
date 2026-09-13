import './landing.css'

// Front door for the festival booth kiosk. Per the Admin policy doc
// (2026-09-13, §2/§15): participant-facing screens must not expose an
// Admin entry point — staff reach /admin by typing the URL directly.
// The participant CTA (→ /participate) belongs to the Participant Flow
// owner and isn't wired up here yet.
function LandingPage() {
  return (
    <div className="landing-shell">
      <div className="landing-onair">
        <span className="landing-onair-dot" />
        ON AIR
      </div>
      <h1 className="landing-title">멋쟁이 타자처럼</h1>
      <p className="landing-subtitle">라디오 부스에 오신 걸 환영합니다.</p>
    </div>
  )
}

export default LandingPage

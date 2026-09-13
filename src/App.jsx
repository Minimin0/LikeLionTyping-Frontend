import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AdminPage from './features/admin/pages/AdminPage'
import LandingPage from './pages/LandingPage'
import LoadingScreen from './components/LoadingScreen'
import './styles/global.css'

// Brief "ON AIR" boot screen before the landing page appears, matching
// the radio-booth concept from the design doc.
const BOOT_DELAY_MS = 1100

// Participant/game routes aren't built yet, so this stands in for /play;
// keeps a way back to the admin console until the real screen lands here.
function PlaceholderPlayScreen() {
  const navigate = useNavigate()

  return (
    <div className="placeholder-screen">
      <p>참가자 화면 준비 중입니다.</p>
      <button
        type="button"
        className="placeholder-screen__back"
        onClick={() => navigate('/admin')}
      >
        운영진 화면으로
      </button>
    </div>
  )
}

// Participant/game routes aren't built yet (other FE owners' scope per
// AGENTS.md), so /play is a placeholder; replace with the real
// participant flow once that scope is implemented.
function App() {
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), BOOT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (isBooting) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/play" element={<PlaceholderPlayScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

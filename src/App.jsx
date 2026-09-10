import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from './features/admin/pages/AdminPage'
import './styles/global.css'

// Participant/game/ranking routes aren't built yet (other FE owners'
// scope per AGENTS.md), so every path falls back to /admin for now.
function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App

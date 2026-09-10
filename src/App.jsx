import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from './features/admin/pages/AdminPage'
import './styles/global.css'

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

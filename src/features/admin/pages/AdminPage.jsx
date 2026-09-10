import { useState } from 'react'
import AdminLoginForm from '../components/AdminLoginForm'
import AdminDashboard from '../components/AdminDashboard'
import '../admin.css'

// Only a UI gate (no real credential is stored). Real auth is verified
// by adminLogin() against the backend; this flag just remembers that a
// login call already succeeded so a page refresh doesn't force a re-login.
const SESSION_KEY = 'admin_authenticated'

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true',
  )

  function handleLoginSuccess() {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setIsAuthenticated(true)
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }

  return (
    <div className="admin-shell">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLoginForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

export default AdminPage

import { useState } from 'react'
import AdminLoginForm from '../components/AdminLoginForm'
import AdminDashboard from '../components/AdminDashboard'
import '../admin.css'

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

import { useEffect, useState } from 'react'
import AdminLoginForm from '../components/AdminLoginForm'
import AdminDashboard from '../components/AdminDashboard'
import { adminLogout } from '../api/adminApi'
import { isAuthenticated as checkIsAuthenticated, onUnauthorized } from '../../../shared/api/adminAuth'
import '../admin.css'

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkIsAuthenticated)

  // Any API call that comes back 401 (expired/missing session) drops the
  // UI back to the login screen.
  useEffect(() => {
    onUnauthorized(() => setIsAuthenticated(false))
  }, [])

  function handleLogout() {
    adminLogout()
    setIsAuthenticated(false)
  }

  return (
    <div className="admin-shell">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  )
}

export default AdminPage

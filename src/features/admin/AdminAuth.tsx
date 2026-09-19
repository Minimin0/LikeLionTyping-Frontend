import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AdminAuthContextValue = {
  token: string | null
  setToken: (token: string | null) => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)
const STORAGE_KEY = 'likelion-admin-token'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [tokenState, setTokenState] = useState<string | null>(() =>
    sessionStorage.getItem(STORAGE_KEY),
  )
  const value = useMemo(
    () => ({
      token: tokenState,
      setToken: (token: string | null) => {
        setTokenState(token)
        if (token) sessionStorage.setItem(STORAGE_KEY, token)
        else sessionStorage.removeItem(STORAGE_KEY)
      },
    }),
    [tokenState],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const value = useContext(AdminAuthContext)
  if (!value) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return value
}

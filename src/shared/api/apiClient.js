import axios from 'axios'
import { getAuthToken, clearAuth, notifyUnauthorized } from './adminAuth'

// Single shared Axios instance (per AGENTS.md #19) — feature API modules
// call this instead of importing axios directly, so baseURL/auth/error
// handling live in exactly one place.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true, // sends the HttpOnly session cookie, if that's the auth mechanism the backend picked
  headers: {
    'Content-Type': 'application/json',
  },
})

// Covers the Bearer-token case; a no-op if the backend uses the cookie
// instead (getAuthToken() returns null and this header is simply omitted).
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalizes every failure to { code, message } per AGENTS.md #18, so
// callers branch on `error.code` instead of raw HTTP status/shape.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const body = error.response?.data

    if (status === 401) {
      clearAuth()
      notifyUnauthorized()
    }

    const normalized = new Error(body?.message ?? '요청 처리 중 오류가 발생했습니다.')
    normalized.code = body?.code ?? (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'UNKNOWN_ERROR')
    normalized.status = status
    return Promise.reject(normalized)
  },
)

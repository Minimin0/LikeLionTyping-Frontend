// Encapsulates the one thing AGENTS.md says UI components must never know:
// whether Admin auth is a Bearer token or an HttpOnly session cookie. Login
// works either way — if the backend returns a token we store and attach it;
// if it instead sets a cookie, apiClient's withCredentials already handles
// it and every function here becomes a harmless no-op.
const TOKEN_KEY = 'admin_token'
const AUTH_FLAG_KEY = 'admin_authenticated'

let unauthorizedListener = null

export function setAuth(token) {
  sessionStorage.setItem(AUTH_FLAG_KEY, 'true')
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_FLAG_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_FLAG_KEY) === 'true'
}

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

// AdminPage registers itself here so a 401 from any API call (session
// expired, wrong/missing cookie) can kick the UI back to the login screen,
// per AGENTS.md #18 ("401 → 로그인 이동").
export function onUnauthorized(listener) {
  unauthorizedListener = listener
}

export function notifyUnauthorized() {
  unauthorizedListener?.()
}

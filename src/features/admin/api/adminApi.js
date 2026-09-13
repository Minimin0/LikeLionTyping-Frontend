// Admin API layer — thin wrappers around the shared apiClient, one
// function per endpoint in the locked Admin policy (관리자 로그인 /
// 참가자 조회 / PAID 이용권 발급 / 경기 무효화+이용권 복구). No mock data
// lives here per the 2026-09-13 Production policy (§11): Mock
// Category/Participant/Ranking/GameSession are all forbidden outside a
// test environment. See [[project-typing-admin-page]] for the full scope
// decision and why fields like standalone pass-cancel/restore and phone
// edit were intentionally never added back.
import { apiClient } from '../../../shared/api/apiClient'
import { setAuth, clearAuth } from '../../../shared/api/adminAuth'

// POST /api/admin/login
export async function adminLogin(password) {
  const { data } = await apiClient.post('/admin/login', { password })
  // Works whether the backend replies with a Bearer token or just sets
  // the session cookie (data.token is then simply undefined).
  setAuth(data?.token)
  return data
}

export function adminLogout() {
  clearAuth()
}

// GET /api/admin/participants?phone={phone}
// Read-only: nickname, phone, every pass, and every game session for one
// participant. No admin action here can edit any of these fields.
export async function searchParticipantByPhone(phone) {
  const normalized = phone.replace(/[-\s]/g, '')
  const { data } = await apiClient.get('/admin/participants', { params: { phone: normalized } })
  return data
}

// POST /api/admin/participants/{participantId}/passes
// Idempotent on the backend: if the participant already has an AVAILABLE
// PAID pass, it's returned as-is instead of minting a duplicate.
export async function issuePaidPass(participantId) {
  const { data } = await apiClient.post(`/admin/participants/${participantId}/passes`)
  return data
}

// POST /api/admin/game-sessions/{gameSessionId}/invalidate
export async function invalidateGameSession(gameSessionId, restorePass) {
  const { data } = await apiClient.post(`/admin/game-sessions/${gameSessionId}/invalidate`, { restorePass })
  return data
}

// GET /api/categories
export async function getCategories() {
  const { data } = await apiClient.get('/categories')
  return data
}

// GET /api/rankings?categoryId={id}
// Public ranking — no phone number.
export async function getRankings(categoryId) {
  const { data } = await apiClient.get('/rankings', { params: { categoryId } })
  return data
}

// GET /api/admin/rankings?categoryId={id}
// Admin-only: includes the phone number for prize-handout verification,
// which the public /api/rankings response must never include.
export async function getAdminRankings(categoryId) {
  const { data } = await apiClient.get('/admin/rankings', { params: { categoryId } })
  return data
}

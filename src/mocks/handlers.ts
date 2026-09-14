import { http, HttpResponse } from 'msw'

let passes = [
  { id: 1, type: 'FREE', status: 'CONSUMED', createdAt: '2026-09-11T09:12:00' },
  { id: 2, type: 'PAID', status: 'AVAILABLE', createdAt: '2026-09-11T09:40:00' },
]
const sessions = [
  { id: 21, categoryId: 2, playPassId: 1, status: 'COMPLETED', elapsedMs: 43821, startedAt: '2026-09-11T09:13:00', completedAt: '2026-09-11T09:13:44' },
  { id: 24, categoryId: 2, playPassId: 2, status: 'IN_PROGRESS', elapsedMs: null, startedAt: '2026-09-11T09:41:00', completedAt: null },
]

export const handlers = [
  http.post('*/admin/login', async () => {
    return HttpResponse.json({ token: 'demo-token', expiresAt: new Date(Date.now() + 3600_000).toISOString() })
  }),
  http.get('*/admin/participants', () => {
    return HttpResponse.json({
      id: 1,
      nickname: '타자왕',
      phone: '01012345678',
      passes,
      gameSessions: sessions,
    })
  }),
  http.post('*/admin/participants/:id/passes', () => {
    const existing = passes.find((p) => p.type === 'PAID' && p.status === 'AVAILABLE')
    if (existing) return HttpResponse.json(existing)
    const pass = { id: passes.length + 1, type: 'PAID', status: 'AVAILABLE', createdAt: new Date().toISOString() }
    passes = [...passes, pass]
    return HttpResponse.json(pass)
  }),
  http.post('*/admin/game-sessions/:id/invalidate', async ({ params }) => {
    const id = Number(params.id)
    const session = sessions.find((s) => s.id === id)
    if (session) {
      session.status = 'INVALIDATED'
      const pass = passes.find((p) => p.id === session.playPassId)
      if (pass) pass.status = 'AVAILABLE'
    }
    return HttpResponse.json({
      gameSessionId: id,
      gameSessionStatus: 'INVALIDATED',
      playPassId: session?.playPassId,
      playPassStatus: 'AVAILABLE',
    })
  }),
]

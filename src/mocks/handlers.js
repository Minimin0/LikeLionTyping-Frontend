import { http, HttpResponse } from 'msw'

// Dev-only fixtures (per the 2026-09-13 Admin policy §11: "MSW/fixture는
// Test 환경에서만 허용한다"). This intercepts the exact endpoints
// adminApi.js calls in real production code — production code itself
// stays wired to the real backend; this file exists only so the Admin
// UI can be exercised locally before/while the real backend is ready.
// Toggle with VITE_USE_MSW=true (see src/mocks/browser.js). Never used
// unless that flag is set.

let participants = [
  { id: 1, nickname: '타자왕', phone: '01012345678', createdAt: '2026-09-11T09:12:00' },
  { id: 2, nickname: '사자왕', phone: '01099998888', createdAt: '2026-09-11T09:20:00' },
  { id: 3, nickname: '코딩사자', phone: '01055554444', createdAt: '2026-09-11T09:31:00' },
]

let passes = [
  { id: 1, participantId: 1, type: 'FREE', status: 'CONSUMED', createdAt: '2026-09-11T09:12:00' },
  { id: 2, participantId: 1, type: 'PAID', status: 'CONSUMED', createdAt: '2026-09-11T09:40:00' },
  { id: 3, participantId: 2, type: 'FREE', status: 'CONSUMED', createdAt: '2026-09-11T09:20:00' },
  { id: 4, participantId: 3, type: 'FREE', status: 'AVAILABLE', createdAt: '2026-09-11T09:31:00' },
]

let sessions = [
  { id: 21, participantId: 1, categoryId: 2, playPassId: 1, status: 'COMPLETED', elapsedMs: 43821, startedAt: '2026-09-11T09:13:00', completedAt: '2026-09-11T09:13:44' },
  { id: 24, participantId: 1, categoryId: 2, playPassId: 2, status: 'IN_PROGRESS', elapsedMs: null, startedAt: '2026-09-11T09:41:00', completedAt: null },
  { id: 22, participantId: 2, categoryId: 2, playPassId: 3, status: 'COMPLETED', elapsedMs: 38990, startedAt: '2026-09-11T09:21:00', completedAt: '2026-09-11T09:21:39' },
  { id: 23, participantId: 3, categoryId: 1, playPassId: null, status: 'INVALIDATED', elapsedMs: 51200, startedAt: '2026-09-11T09:33:00', completedAt: '2026-09-11T09:33:51' },
]

const categories = [
  { id: 1, code: 'CH01', name: '성결 멋사 ON AIR' },
  { id: 2, code: 'CH02', name: '캠퍼스 주파수' },
  { id: 3, code: 'CH03', name: '페스티벌 라디오' },
]

let nextPassId = 5

function buildRanking(categoryId, includePhone) {
  const bestByParticipant = new Map()
  sessions
    .filter((s) => s.categoryId === categoryId && s.status === 'COMPLETED')
    .forEach((s) => {
      const current = bestByParticipant.get(s.participantId)
      if (!current || s.elapsedMs < current.elapsedMs) bestByParticipant.set(s.participantId, s)
    })

  return Array.from(bestByParticipant.values())
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
    .map((s, index) => {
      const participant = participants.find((p) => p.id === s.participantId)
      const entry = { rank: index + 1, nickname: participant?.nickname ?? '알 수 없음', elapsedMs: s.elapsedMs }
      return includePhone ? { ...entry, phone: participant?.phone ?? null } : entry
    })
}

export const handlers = [
  http.post('/api/admin/login', async ({ request }) => {
    const body = await request.json()
    if (!body?.password || body.password.trim().length < 4) {
      return HttpResponse.json({ code: 'INVALID_ADMIN_PASSWORD', message: '비밀번호를 4자 이상 입력해주세요.' }, { status: 401 })
    }
    return HttpResponse.json({ token: 'mock-admin-session-token' })
  }),

  http.get('/api/admin/participants', ({ request }) => {
    const phone = new URL(request.url).searchParams.get('phone')?.replace(/[-\s]/g, '')
    const participant = participants.find((p) => p.phone === phone)
    if (!participant) {
      return HttpResponse.json({ code: 'PARTICIPANT_NOT_FOUND', message: '일치하는 참가자를 찾을 수 없습니다.' }, { status: 404 })
    }
    const participantPasses = passes.filter((pass) => pass.participantId === participant.id)
    const participantSessions = sessions
      .filter((s) => s.participantId === participant.id)
      .map((s) => ({ ...s, category: categories.find((c) => c.id === s.categoryId) ?? null }))
    return HttpResponse.json({ participant, passes: participantPasses, sessions: participantSessions })
  }),

  http.post('/api/admin/participants/:participantId/passes', ({ params }) => {
    const participantId = Number(params.participantId)
    const existing = passes.find((p) => p.participantId === participantId && p.type === 'PAID' && p.status === 'AVAILABLE')
    if (existing) return HttpResponse.json(existing)

    const pass = { id: nextPassId++, participantId, type: 'PAID', status: 'AVAILABLE', createdAt: new Date().toISOString() }
    passes = [...passes, pass]
    return HttpResponse.json(pass)
  }),

  http.post('/api/admin/game-sessions/:gameSessionId/invalidate', async ({ params, request }) => {
    const sessionId = Number(params.gameSessionId)
    const { restorePass } = await request.json()
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) {
      return HttpResponse.json({ code: 'GAME_SESSION_NOT_FOUND', message: '경기를 찾을 수 없습니다.' }, { status: 404 })
    }
    if (session.status === 'INVALIDATED') {
      return HttpResponse.json({ code: 'INVALID_GAME_STATE', message: '이미 무효 처리된 경기입니다.' }, { status: 409 })
    }

    if (restorePass && session.playPassId) {
      const usedElsewhere = sessions.some(
        (s) => s.id !== session.id && s.playPassId === session.playPassId && (s.status === 'IN_PROGRESS' || s.status === 'COMPLETED'),
      )
      if (usedElsewhere) {
        return HttpResponse.json({ code: 'PASS_IN_USE', message: '해당 이용권이 다른 유효한 경기에서 사용 중이라 복구할 수 없습니다.' }, { status: 409 })
      }
    }

    session.status = 'INVALIDATED'
    let restoredPass = null
    if (restorePass && session.playPassId) {
      const pass = passes.find((p) => p.id === session.playPassId)
      if (pass) {
        pass.status = 'AVAILABLE'
        restoredPass = pass
      }
    }
    return HttpResponse.json({ session, restoredPass })
  }),

  http.get('/api/categories', () => HttpResponse.json(categories)),

  http.get('/api/rankings', ({ request }) => {
    const categoryId = Number(new URL(request.url).searchParams.get('categoryId'))
    return HttpResponse.json(buildRanking(categoryId, false))
  }),

  http.get('/api/admin/rankings', ({ request }) => {
    const categoryId = Number(new URL(request.url).searchParams.get('categoryId'))
    return HttpResponse.json(buildRanking(categoryId, true))
  }),
]

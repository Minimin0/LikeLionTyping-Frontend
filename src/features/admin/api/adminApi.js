// Mock Admin API layer.
// DTO shapes mirror the locked contract in AGENTS.md so swapping these
// functions for real axios calls to Spring Boot requires no UI changes.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizePhone = (phone) => phone.replace(/[-\s]/g, '')

const mockCategories = [
  { id: 1, code: 'CH01', name: '성결 멋사 ON AIR' },
  { id: 2, code: 'CH02', name: '캠퍼스 주파수' },
  { id: 3, code: 'CH03', name: '페스티벌 라디오' },
]

// 카테고리별 5문장 세트의 총 글자 수(고정). 모든 참가자가 같은 문장을
// 입력하므로, 완료 시간과 함께 분당 타수(CPM)를 계산하는 데 사용한다.
const categoryCharCount = { 1: 240, 2: 268, 3: 255 }

function calculateTypingSpeed(categoryId, elapsedMs) {
  if (elapsedMs == null) return null
  const totalChars = categoryCharCount[categoryId] ?? 0
  const minutes = elapsedMs / 60000
  return Math.round(totalChars / minutes)
}

let mockParticipants = [
  { id: 1, nickname: '타자왕', phone: '01012345678', createdAt: '2026-09-11T09:12:00' },
  { id: 2, nickname: '사자왕', phone: '01099998888', createdAt: '2026-09-11T09:20:00' },
  { id: 3, nickname: '코딩사자', phone: '01055554444', createdAt: '2026-09-11T09:31:00' },
]

let mockPasses = [
  { id: 1, participantId: 1, type: 'FREE', status: 'CONSUMED', createdAt: '2026-09-11T09:12:00' },
  { id: 2, participantId: 1, type: 'PAID', status: 'CONSUMED', createdAt: '2026-09-11T09:40:00' },
  { id: 3, participantId: 2, type: 'FREE', status: 'CONSUMED', createdAt: '2026-09-11T09:20:00' },
  { id: 4, participantId: 3, type: 'FREE', status: 'AVAILABLE', createdAt: '2026-09-11T09:31:00' },
]

let mockSessions = [
  {
    id: 21,
    participantId: 1,
    categoryId: 2,
    playPassId: 1,
    status: 'COMPLETED',
    elapsedMs: 43821,
    startedAt: '2026-09-11T09:13:00',
    completedAt: '2026-09-11T09:13:44',
  },
  {
    id: 24,
    participantId: 1,
    categoryId: 2,
    playPassId: 2,
    status: 'IN_PROGRESS',
    elapsedMs: null,
    startedAt: '2026-09-11T09:41:00',
    completedAt: null,
  },
  {
    id: 22,
    participantId: 2,
    categoryId: 2,
    playPassId: 3,
    status: 'COMPLETED',
    elapsedMs: 38990,
    startedAt: '2026-09-11T09:21:00',
    completedAt: '2026-09-11T09:21:39',
  },
  {
    id: 23,
    participantId: 3,
    categoryId: 1,
    playPassId: null,
    status: 'INVALIDATED',
    elapsedMs: 51200,
    startedAt: '2026-09-11T09:33:00',
    completedAt: '2026-09-11T09:33:51',
  },
]

let nextPassId = 5

let registrationOpen = true

// POST /api/admin/login
export async function adminLogin(password) {
  await delay(500)
  if (!password || password.trim().length < 4) {
    const error = new Error('비밀번호를 4자 이상 입력해주세요.')
    error.code = 'INVALID_ADMIN_PASSWORD'
    throw error
  }
  // Actual credential verification happens on the Spring Boot server
  // (server env var + Spring Security). This mock only simulates the
  // network round trip so the Admin UI can be built ahead of Backend.
  return { token: 'mock-admin-session-token' }
}

// GET /api/admin/participants?phone={phone}
export async function searchParticipantByPhone(phone) {
  await delay(450)
  const normalized = normalizePhone(phone)
  const participant = mockParticipants.find((p) => p.phone === normalized)

  if (!participant) {
    const error = new Error('일치하는 참가자를 찾을 수 없습니다.')
    error.code = 'PARTICIPANT_NOT_FOUND'
    throw error
  }

  const passes = mockPasses.filter((pass) => pass.participantId === participant.id)
  const sessions = mockSessions
    .filter((session) => session.participantId === participant.id)
    .map((session) => ({
      ...session,
      category: mockCategories.find((c) => c.id === session.categoryId) ?? null,
      typingSpeed: calculateTypingSpeed(session.categoryId, session.elapsedMs),
    }))

  return { participant, passes, sessions }
}

// POST /api/admin/participants/{participantId}/passes
export async function issuePaidPass(participantId) {
  await delay(450)
  const participant = mockParticipants.find((p) => p.id === participantId)
  if (!participant) {
    const error = new Error('참가자를 찾을 수 없습니다.')
    error.code = 'PARTICIPANT_NOT_FOUND'
    throw error
  }

  const pass = {
    id: nextPassId++,
    participantId,
    type: 'PAID',
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
  }
  mockPasses = [...mockPasses, pass]
  return pass
}

// POST /api/admin/participants/{participantId}/passes/{passId}/cancel
// 결제 후 게임 시작 전 취소: 미사용(AVAILABLE) 이용권을 회수하고 현장에서
// 500원(PAID인 경우)을 환불한다.
export async function cancelPass(passId) {
  await delay(400)
  const pass = mockPasses.find((p) => p.id === passId)
  if (!pass) {
    const error = new Error('이용권을 찾을 수 없습니다.')
    error.code = 'PASS_NOT_FOUND'
    throw error
  }
  if (pass.status !== 'AVAILABLE') {
    const error = new Error('사용 가능 상태의 이용권만 취소할 수 있습니다.')
    error.code = 'INVALID_PASS_STATE'
    throw error
  }

  pass.status = 'CANCELLED'
  return pass
}

// POST /api/admin/passes/{passId}/restore
// 경기와 무관하게 이용권이 중복 차감된 경우, 해당 이용권만 단독으로
// AVAILABLE 상태로 복구한다. (경기 무효 처리에 딸린 복구와는 별개 동작)
export async function restorePassById(passId) {
  await delay(400)
  const pass = mockPasses.find((p) => p.id === passId)
  if (!pass) {
    const error = new Error('이용권을 찾을 수 없습니다.')
    error.code = 'PASS_NOT_FOUND'
    throw error
  }
  if (pass.status !== 'CONSUMED') {
    const error = new Error('사용된(CONSUMED) 이용권만 복구할 수 있습니다.')
    error.code = 'INVALID_PASS_STATE'
    throw error
  }

  pass.status = 'AVAILABLE'
  return pass
}

// PATCH /api/admin/participants/{participantId}/phone
// 전화번호 오입력 정정: 운영진이 본인 확인 후에만 사용한다.
export async function updateParticipantPhone(participantId, newPhone) {
  await delay(400)
  const participant = mockParticipants.find((p) => p.id === participantId)
  if (!participant) {
    const error = new Error('참가자를 찾을 수 없습니다.')
    error.code = 'PARTICIPANT_NOT_FOUND'
    throw error
  }

  const normalized = normalizePhone(newPhone)
  if (normalized.length !== 11) {
    const error = new Error('전화번호 11자리를 입력해주세요.')
    error.code = 'INVALID_PHONE'
    throw error
  }

  const duplicate = mockParticipants.find((p) => p.phone === normalized && p.id !== participantId)
  if (duplicate) {
    const error = new Error('이미 다른 참가자가 사용 중인 전화번호입니다.')
    error.code = 'PHONE_ALREADY_REGISTERED'
    throw error
  }

  participant.phone = normalized
  return participant
}

// POST /api/admin/game-sessions/{gameSessionId}/invalidate
export async function invalidateGameSession(gameSessionId, restorePass) {
  await delay(450)
  const session = mockSessions.find((s) => s.id === gameSessionId)
  if (!session) {
    const error = new Error('경기를 찾을 수 없습니다.')
    error.code = 'GAME_SESSION_NOT_FOUND'
    throw error
  }
  if (session.status === 'INVALIDATED') {
    const error = new Error('이미 무효 처리된 경기입니다.')
    error.code = 'INVALID_GAME_STATE'
    throw error
  }

  session.status = 'INVALIDATED'

  let restoredPass = null
  if (restorePass && session.playPassId) {
    const pass = mockPasses.find((p) => p.id === session.playPassId)
    if (pass) {
      pass.status = 'AVAILABLE'
      restoredPass = pass
    }
  }

  return { session, restoredPass }
}

// GET /api/categories
export async function getCategories() {
  await delay(200)
  return mockCategories
}

// GET /api/rankings?categoryId={id}
// 공개 랭킹 화면은 이 값에서 phone을 제외하고 사용한다(전화번호는
// 공개 API·화면에 노출 금지). 아래 getAdminRankings가 운영진 전용이다.
export async function getRankings(categoryId) {
  await delay(400)
  return buildRankingList(categoryId).map(({ phone: _phone, ...entry }) => entry)
}

// GET /api/admin/rankings?categoryId={id}
// 운영진 화면 전용: 상품 지급 시 본인 확인을 위해 전화번호를 함께 내려준다.
export async function getAdminRankings(categoryId) {
  await delay(400)
  return buildRankingList(categoryId)
}

function buildRankingList(categoryId) {
  const bestByParticipant = new Map()

  mockSessions
    .filter((s) => s.categoryId === categoryId && s.status === 'COMPLETED')
    .forEach((s) => {
      const current = bestByParticipant.get(s.participantId)
      if (!current || s.elapsedMs < current.elapsedMs) {
        bestByParticipant.set(s.participantId, s)
      }
    })

  return Array.from(bestByParticipant.values())
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
    .map((s, index) => {
      const participant = mockParticipants.find((p) => p.id === s.participantId)
      return {
        rank: index + 1,
        nickname: participant?.nickname ?? '알 수 없음',
        phone: participant?.phone ?? null,
        elapsedMs: s.elapsedMs,
        typingSpeed: calculateTypingSpeed(categoryId, s.elapsedMs),
      }
    })
}

// GET /api/admin/registration-status (마감 관리)
export async function getRegistrationStatus() {
  await delay(150)
  return { open: registrationOpen }
}

// POST /api/admin/registration-status
export async function setRegistrationStatus(open) {
  await delay(300)
  registrationOpen = open
  return { open: registrationOpen }
}

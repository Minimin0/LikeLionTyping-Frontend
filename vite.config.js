import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

/**
 * 실제 API 응답 타입(shared/api/types.ts)과 동일한 형태로 맞춘 고정 데이터.
 * 타입이 어긋나면 나중에 실제 백엔드를 붙였을 때 화면이 터지므로, 필드 이름과
 * null 가능 여부까지 실제 DTO 기준으로 맞춘다.
 */
const CATEGORIES = [
  { id: 1, code: 'CH01', name: '성결대 멋사' },
  { id: 2, code: 'CH02', name: '멋쟁이사자처럼' },
  { id: 3, code: 'CH03', name: '페스티벌 라디오' },
]

// 띄어쓰기·쉼표·마침표·느낌표를 실제 운영 확정 문장 그대로 둔다. 통일하지 않는다.
const SENTENCES = {
  1: [
    '안녕하세요 성결대학교 멋쟁이사자처럼입니다!',
    '프론트엔드 백엔드 기획디자인 세 부서가 한 팀이 됩니다',
    '상상을 코드로 아이디어를 현실로 만드는 개발동아리!',
    '함께 고민하고 함께 성장합니다',
    '저희의 아기사자가 되어주세요!',
  ],
  2: [
    '전국 약 80개 대학이 함께하는 멋쟁이사자처럼',
    '대표 활동은? 바로 해커톤입니다',
    '제한된 시간 폭발하는 아이디어!',
    '오늘의 버그가 내일의 실력이 됩니다',
    '당신의 도전을 기다립니다 아기사자님!',
  ],
  3: [
    '기다리던 동아리 페스티벌 오늘만큼은 마음껏 즐겨볼까요!',
    '좋아하는 노래가 들려오면 친구와 함께 신나게 따라 불러보세요.',
    '처음 듣는 노래도 이런 날 들으면 왠지 좋아지는 것 같아요!',
    '신나는 음악과 웃음소리가 가득한 지금 이 순간을 제대로 즐겨봐요.',
    '오늘 함께 들었던 노래와 추억은 오래 남을 거예요!',
  ],
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function sendError(res, status, code, message) {
  sendJson(res, status, { code, message: message ?? code })
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

/**
 * 개발 서버 전용 Mock API.
 *
 * 로컬에 백엔드를 띄울 수 없어 참가자 확인 → 카테고리 → 게임 → 결과 → 랭킹까지
 * 전체 흐름을 프론트만으로 확인하기 위한 장치다. src/ 밖(이 파일 안)에만 있고
 * `apply: 'serve'`로 개발 서버에서만 동작하므로 `vite build` 산출물에는
 * 전혀 포함되지 않는다. Production Mock 금지 정책과 무관하다.
 *
 * DEV_API_TARGET(.env.local)이 설정되면 이 플러그인은 아예 등록되지 않고
 * server.proxy가 그 주소로 실제 요청을 넘긴다 (아래 defineConfig 참고).
 */
function devMockApiPlugin() {
  // 참가자/게임 세션은 개발 서버 재시작 전까지만 유지되는 인메모리 상태다.
  let nextParticipantId = 4
  let nextGameSessionId = 4
  let nextPassId = 7
  let nextPaymentId = 1
  const participantsByPhone = new Map()
  const gameSessions = new Map()
  const bestByParticipantCategory = new Map()
  const payments = []
  const adminToken = 'dev-admin-token'

  const seededParticipants = [
    { participantId: 1, nickname: '타자왕', phone: '01012345678', elapsedMs: 36120 },
    { participantId: 2, nickname: '사자왕', phone: '01022223333', elapsedMs: 38990 },
    { participantId: 3, nickname: '코딩사자', phone: '01033334444', elapsedMs: 43821 },
  ]
  seededParticipants.forEach((seed, index) => {
    const passId = index + 1
    participantsByPhone.set(seed.phone, {
      participantId: seed.participantId,
      nickname: seed.nickname,
      phone: seed.phone,
      availablePassCount: index === 0 ? 1 : 0,
      passes: [
        {
          id: passId,
          type: 'FREE',
          status: 'CONSUMED',
          createdAt: '2026-09-14T00:00:00Z',
        },
        ...(index === 0
          ? [{ id: 4, type: 'PAID', status: 'AVAILABLE', createdAt: '2026-09-14T00:10:00Z' }]
          : []),
      ],
    })
    gameSessions.set(index + 1, {
      id: index + 1,
      participantId: seed.participantId,
      categoryId: 1,
      nickname: seed.nickname,
      playPassId: passId,
      status: 'COMPLETED',
      elapsedMs: seed.elapsedMs,
      startedAt: '2026-09-14T00:20:00Z',
        completedAt: '2026-09-14T00:21:00Z',
        invalidationReason: null,
      })
    bestByParticipantCategory.set(`${seed.participantId}:1`, seed.elapsedMs)
  })

  const findParticipantById = (participantId) => {
    for (const participant of participantsByPhone.values()) {
      if (participant.participantId === participantId) return participant
    }
    return null
  }

  const rankingRows = (categoryId) => {
    const bestByParticipant = new Map()
    for (const session of gameSessions.values()) {
      if (session.categoryId !== categoryId || session.status !== 'COMPLETED') continue
      const previous = bestByParticipant.get(session.participantId)
      if (!previous || session.elapsedMs < previous.elapsedMs) {
        bestByParticipant.set(session.participantId, session)
      }
    }

    const rows = [...bestByParticipant.values()].sort(
      (left, right) => left.elapsedMs - right.elapsedMs,
    )
    let previousElapsed = null
    let rank = 0
    return rows.map((session, index) => {
      if (session.elapsedMs !== previousElapsed) rank = index + 1
      previousElapsed = session.elapsedMs
      return { ...session, rank }
    })
  }

  const computeRank = (categoryId, participantId) => {
    const row = rankingRows(categoryId).find(
      (entry) => entry.participantId === participantId,
    )
    return row?.rank ?? null
  }

  const handleIdentify = (res, body) => {
    const nickname = String(body?.nickname ?? '').trim()
    const phone = String(body?.phone ?? '').replace(/[-\s]/g, '')
    if (!nickname || !phone) {
      return sendError(res, 400, 'VALIDATION_ERROR', '닉네임과 전화번호가 필요합니다.')
    }

    const existing = participantsByPhone.get(phone)
    if (existing) {
      if (existing.nickname !== nickname) {
        return sendError(
          res,
          409,
          'NICKNAME_MISMATCH',
          '이미 등록된 전화번호입니다. 처음 등록한 닉네임을 입력해주세요.',
        )
      }
      return sendJson(res, 200, {
        participantId: existing.participantId,
        nickname: existing.nickname,
        isNewParticipant: false,
        availablePassCount: existing.availablePassCount,
      })
    }

    const participant = {
      participantId: nextParticipantId++,
      nickname,
      phone,
      // 첫 참여는 무료 1회.
      availablePassCount: 1,
      passes: [
        {
          id: nextPassId++,
          type: 'FREE',
          status: 'AVAILABLE',
          createdAt: new Date().toISOString(),
        },
      ],
    }
    participantsByPhone.set(phone, participant)
    return sendJson(res, 200, {
      participantId: participant.participantId,
      nickname: participant.nickname,
      isNewParticipant: true,
      availablePassCount: participant.availablePassCount,
    })
  }

  const handleStartGame = (res, body) => {
    const participantId = Number(body?.participantId)
    const categoryId = Number(body?.categoryId)
    const category = CATEGORIES.find((item) => item.id === categoryId)
    if (!category) return sendError(res, 404, 'CATEGORY_NOT_FOUND', '존재하지 않는 카테고리입니다.')

    const participant = findParticipantById(participantId)
    if (!participant) return sendError(res, 404, 'PARTICIPANT_NOT_FOUND', '참가자를 찾을 수 없습니다.')

    const activeGame = [...gameSessions.values()].find(
      (session) =>
        session.participantId === participantId &&
        session.status === 'IN_PROGRESS',
    )
    if (activeGame) {
      if (activeGame.categoryId !== categoryId) {
        return sendError(
          res,
          409,
          'ACTIVE_GAME_EXISTS',
          '다른 카테고리의 게임이 이미 진행 중입니다.',
        )
      }
      const sentences = SENTENCES[categoryId].map((content, index) => ({
        sequence: index + 1,
        content,
      }))
      return sendJson(res, 200, {
        gameSessionId: activeGame.id,
        category,
        sentences,
      })
    }

    if (participant.availablePassCount <= 0) {
      return sendError(
        res,
        409,
        'NO_AVAILABLE_PASS',
        '무료 참여를 이미 사용했습니다. 재도전은 운영진에게 문의해주세요.',
      )
    }
    const pass = participant.passes.find((item) => item.status === 'AVAILABLE')
    if (!pass) {
      return sendError(
        res,
        409,
        'NO_AVAILABLE_PASS',
        '무료 참여를 이미 사용했습니다. 재도전은 운영진에게 문의해주세요.',
      )
    }
    pass.status = 'CONSUMED'
    participant.availablePassCount -= 1

    const gameSessionId = nextGameSessionId++
    gameSessions.set(gameSessionId, {
      id: gameSessionId,
      participantId,
      categoryId,
      nickname: participant.nickname,
      playPassId: pass.id,
      status: 'IN_PROGRESS',
      elapsedMs: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    })

    const sentences = SENTENCES[categoryId].map((content, index) => ({
      sequence: index + 1,
      content,
    }))

    return sendJson(res, 200, { gameSessionId, category, sentences })
  }

  const handleComplete = (res, gameSessionId, body) => {
    const session = gameSessions.get(gameSessionId)
    if (!session) return sendError(res, 404, 'GAME_SESSION_NOT_FOUND', '게임 세션을 찾을 수 없습니다.')
    if (session.status !== 'IN_PROGRESS') {
      return sendError(res, 409, 'INVALID_GAME_STATE', '이미 처리된 경기입니다.')
    }

    const elapsedMs = Math.round(Number(body?.elapsedMs) || 0)
    if (elapsedMs <= 0) {
      return sendError(
        res,
        400,
        'INVALID_ELAPSED_TIME',
        '게임 시간은 0보다 커야 합니다.',
      )
    }
    session.status = 'COMPLETED'
    session.elapsedMs = elapsedMs
    session.completedAt = new Date().toISOString()

    const bestKey = `${session.participantId}:${session.categoryId}`
    const previousBest = bestByParticipantCategory.get(bestKey)
    const personalBest = previousBest === undefined || elapsedMs < previousBest
    const personalBestMs = personalBest ? elapsedMs : previousBest
    if (personalBest) bestByParticipantCategory.set(bestKey, elapsedMs)

    return sendJson(res, 200, {
      gameSessionId,
      status: 'COMPLETED',
      elapsedMs,
      personalBestMs,
      personalBest,
      rank: computeRank(session.categoryId, session.participantId),
    })
  }

  const handleGetGame = (res, gameSessionId) => {
    const session = gameSessions.get(gameSessionId)
    if (!session) return sendError(res, 404, 'GAME_SESSION_NOT_FOUND', '게임 세션을 찾을 수 없습니다.')

    if (session.status !== 'COMPLETED') {
      return sendJson(res, 200, {
        gameSessionId,
        status: session.status,
        elapsedMs: null,
        personalBestMs: null,
        personalBest: false,
        rank: null,
      })
    }

    const bestKey = `${session.participantId}:${session.categoryId}`
    const personalBestMs = bestByParticipantCategory.get(bestKey) ?? session.elapsedMs
    return sendJson(res, 200, {
      gameSessionId,
      status: 'COMPLETED',
      elapsedMs: session.elapsedMs,
      personalBestMs,
      personalBest: personalBestMs === session.elapsedMs,
      rank: computeRank(session.categoryId, session.participantId),
    })
  }

  const handleRankings = (res, categoryId) => {
    const rankings = rankingRows(categoryId)
      .slice(0, 20)
      .map((session) => ({
        rank: session.rank,
        nickname: session.nickname,
        elapsedMs: session.elapsedMs,
      }))
    return sendJson(res, 200, rankings)
  }

  const isAdmin = (req) => req.headers.authorization === `Bearer ${adminToken}`

  const handleAdminLogin = (res, body) => {
    if (body?.password !== 'admin') {
      return sendError(res, 401, 'ADMIN_UNAUTHORIZED', '관리자 비밀번호가 올바르지 않습니다.')
    }
    return sendJson(res, 200, {
      token: adminToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
  }

  const dashboard = () => {
    const sessions = [...gameSessions.values()]
    const categoryCount = (id) => sessions.filter((session) => session.categoryId === id).length
    return {
      totalParticipants: participantsByPhone.size,
      totalPlayCount: sessions.length,
      freePlayCount: sessions.filter((session) => {
        const participant = findParticipantById(session.participantId)
        return participant?.passes.find((pass) => pass.id === session.playPassId)?.type === 'FREE'
      }).length,
      paidPlayCount: sessions.filter((session) => {
        const participant = findParticipantById(session.participantId)
        return participant?.passes.find((pass) => pass.id === session.playPassId)?.type === 'PAID'
      }).length,
      totalPaymentAmountKrw: payments.reduce((sum, payment) => sum + payment.amountKrw, 0),
      availablePaidPassCount: [...participantsByPhone.values()].flatMap((participant) => participant.passes)
        .filter((pass) => pass.type === 'PAID' && pass.status === 'AVAILABLE').length,
      ch01PlayCount: categoryCount(1),
      ch02PlayCount: categoryCount(2),
      ch03PlayCount: categoryCount(3),
      completedGameCount: sessions.filter((session) => session.status === 'COMPLETED').length,
      invalidatedGameCount: sessions.filter((session) => session.status === 'INVALIDATED').length,
    }
  }

  const adminParticipant = (participant) => ({
    id: participant.participantId,
    nickname: participant.nickname,
    phone: participant.phone,
    passes: participant.passes,
    gameSessions: [...gameSessions.values()]
      .filter((session) => session.participantId === participant.participantId)
      .map((session) => ({
        id: session.id,
        categoryId: session.categoryId,
        playPassId: session.playPassId,
        status: session.status,
        elapsedMs: session.elapsedMs,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        invalidationReason: session.invalidationReason ?? null,
      })),
    payments: payments
      .filter((payment) => payment.participantId === participant.participantId)
      .sort((a, b) => b.id - a.id),
    summary: {
      freeParticipationUsed: participant.passes.some((pass) => pass.type === 'FREE' && pass.status === 'CONSUMED'),
      availablePassCount: participant.passes.filter((pass) => pass.status === 'AVAILABLE').length,
      availablePaidPassCount: participant.passes.filter((pass) => pass.type === 'PAID' && pass.status === 'AVAILABLE').length,
      totalPlayCount: [...gameSessions.values()].filter((session) => session.participantId === participant.participantId).length,
      completedGameCount: [...gameSessions.values()].filter((session) => session.participantId === participant.participantId && session.status === 'COMPLETED').length,
      invalidatedGameCount: [...gameSessions.values()].filter((session) => session.participantId === participant.participantId && session.status === 'INVALIDATED').length,
      totalPaymentAmountKrw: payments
        .filter((payment) => payment.participantId === participant.participantId)
        .reduce((sum, payment) => sum + payment.amountKrw, 0),
      bestRecords: CATEGORIES.map((category) => ({
        categoryCode: category.code,
        elapsedMs: bestByParticipantCategory.get(`${participant.participantId}:${category.id}`) ?? null,
      })),
    },
  })

  const handleAdminSearch = (req, res, searchValue, legacyPhone = false) => {
    if (!isAdmin(req)) return sendError(res, 401, 'ADMIN_UNAUTHORIZED')
    const query = String(searchValue ?? '').trim()
    const normalizedPhone = query.replace(/[-\s]/g, '')
    const matches = /^[0-9-\s]+$/.test(query)
      ? [...participantsByPhone.values()].filter((participant) => participant.phone === normalizedPhone)
      : [...participantsByPhone.values()].filter((participant) => participant.nickname.includes(query))
    if (legacyPhone) {
      if (matches[0]) return sendJson(res, 200, adminParticipant(matches[0]))
      return sendError(res, 404, 'PARTICIPANT_NOT_FOUND')
    }
    return sendJson(res, 200, matches.map(adminParticipant))
  }

  const handleIssuePass = (req, res, participantId, body) => {
    if (!isAdmin(req)) return sendError(res, 401, 'ADMIN_UNAUTHORIZED')
    const participant = findParticipantById(participantId)
    if (!participant) return sendError(res, 404, 'PARTICIPANT_NOT_FOUND')
    const quantity = Number(body?.quantity ?? 1)
    if (!Number.isInteger(quantity) || quantity <= 0) return sendError(res, 400, 'VALIDATION_ERROR')
    const payment = {
      id: nextPaymentId++,
      participantId,
      quantity,
      amountKrw: quantity * 500,
      createdAt: new Date().toISOString(),
    }
    payments.push(payment)
    const issued = Array.from({ length: quantity }, () => {
      const pass = {
        id: nextPassId++,
        type: 'PAID',
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      }
      participant.passes.push(pass)
      participant.availablePassCount += 1
      return pass
    })
    return sendJson(res, 201, {
      quantity,
      amountKrw: payment.amountKrw,
      availablePaidPassCount: participant.passes.filter((pass) => pass.type === 'PAID' && pass.status === 'AVAILABLE').length,
      payment,
      passes: issued,
    })
  }

  const handleInvalidate = (req, res, gameSessionId, body) => {
    if (!isAdmin(req)) return sendError(res, 401, 'ADMIN_UNAUTHORIZED')
    const session = gameSessions.get(gameSessionId)
    if (!session) return sendError(res, 404, 'GAME_SESSION_NOT_FOUND')
    if (session.status === 'INVALIDATED') {
      return sendError(res, 409, 'INVALID_GAME_STATE', '이미 무효화된 경기입니다.')
    }
    session.status = 'INVALIDATED'
    session.invalidationReason = body?.reason ?? ''
    const participant = findParticipantById(session.participantId)
    const pass = participant?.passes.find((item) => item.id === session.playPassId)
    if (body?.restorePass && participant && pass) {
      pass.status = 'AVAILABLE'
      participant.availablePassCount += 1
    } else if (pass) {
      pass.status = 'CANCELLED'
    }
    return sendJson(res, 200, {
      gameSessionId,
      gameSessionStatus: 'INVALIDATED',
      playPassId: session.playPassId,
      playPassStatus: pass?.status ?? 'CANCELLED',
    })
  }

  return {
    name: 'dev-mock-api',
    apply: 'serve', // 개발 서버에서만 동작. vite build에는 이 플러그인 자체가 실행되지 않는다.
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        try {
          // connect가 '/api' 접두사를 이미 떼어내고 넘겨준다 (req.url은 '/categories' 형태).
          const url = new URL(req.url, 'http://localhost')
          const { pathname } = url
          const { method } = req

          if (method === 'POST' && pathname === '/participants/identify') {
            return handleIdentify(res, await readJsonBody(req))
          }
          if (method === 'GET' && pathname === '/categories') {
            return sendJson(res, 200, CATEGORIES)
          }
          if (method === 'POST' && pathname === '/game-sessions') {
            return handleStartGame(res, await readJsonBody(req))
          }
          const completeMatch = pathname.match(/^\/game-sessions\/(\d+)\/complete$/)
          if (method === 'POST' && completeMatch) {
            return handleComplete(res, Number(completeMatch[1]), await readJsonBody(req))
          }
          const gameSessionMatch = pathname.match(/^\/game-sessions\/(\d+)$/)
          if (method === 'GET' && gameSessionMatch) {
            return handleGetGame(res, Number(gameSessionMatch[1]))
          }
          if (method === 'GET' && pathname === '/rankings') {
            return handleRankings(res, Number(url.searchParams.get('categoryId')))
          }
          if (method === 'POST' && pathname === '/admin/login') {
            return handleAdminLogin(res, await readJsonBody(req))
          }
          if (method === 'GET' && pathname === '/admin/dashboard') {
            if (!isAdmin(req)) return sendError(res, 401, 'ADMIN_UNAUTHORIZED')
            return sendJson(res, 200, dashboard())
          }
          if (method === 'GET' && pathname === '/admin/participants') {
            const query = url.searchParams.get('query')
            if (query != null) return handleAdminSearch(req, res, query)
            return handleAdminSearch(req, res, url.searchParams.get('phone'), true)
          }
          const passMatch = pathname.match(/^\/admin\/participants\/(\d+)\/passes$/)
          if (method === 'POST' && passMatch) {
            return handleIssuePass(req, res, Number(passMatch[1]), await readJsonBody(req))
          }
          const invalidateMatch = pathname.match(/^\/admin\/game-sessions\/(\d+)\/invalidate$/)
          if (method === 'POST' && invalidateMatch) {
            return handleInvalidate(
              req,
              res,
              Number(invalidateMatch[1]),
              await readJsonBody(req),
            )
          }

          next()
        } catch (error) {
          sendError(res, 500, 'MOCK_ERROR', error instanceof Error ? error.message : 'mock error')
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devApiTarget = env.DEV_API_TARGET

  return {
    plugins: [react(), tailwindcss(), ...(devApiTarget ? [] : [devMockApiPlugin()])],
    server: {
      // .env.local에 DEV_API_TARGET=http://실제서버주소 를 설정하면 Mock 대신
      // 이 프록시가 동작한다. 백엔드 주소가 정해지면 이 한 줄만 바꾸면 된다.
      proxy: devApiTarget
        ? { '/api': { target: devApiTarget, changeOrigin: true } }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})

/**
 * 게임 API의 MSW Mock 핸들러.
 *
 * TODO: 백엔드 연동 시 제거 — 이 파일이 없어져도 컴포넌트/훅 코드는 그대로 동작해야 한다.
 * 그래서 응답은 반드시 types/game.types.ts의 DTO와 100% 동일한 형태로만 만든다.
 *
 * PlayPass 소비, 세션 상태 전이, PB 판정은 원래 Backend의 권한이다.
 * 여기서 흉내내는 이유는 프론트의 실패 케이스(이용권 소진 / 중복 제출)를
 * 실제와 같은 흐름으로 QA하기 위해서일 뿐이다.
 */
import { delay, http, HttpResponse } from 'msw'

import type {
  CompleteGameRequest,
  CompleteGameResponse,
  GameSessionResponse,
  GameSessionStatus,
  SentenceDto,
  StartGameRequest,
} from '../types/game.types'
import { CH02_ITEM_COUNT, MOCK_INITIAL_PASS_COUNT } from '../constants/game.constants'
import { MOCK_CATEGORIES, MOCK_SENTENCES } from '../constants/mockSentences'
import { pickUniversities } from '../constants/universities'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/* ---- Mock 서버 상태 (새로고침하면 초기화된다) ---- */

interface MockSession {
  categoryId: number
  status: GameSessionStatus
  elapsedMs: number | null
}

let remainingPassCount = MOCK_INITIAL_PASS_COUNT
let nextSessionId = 21
let personalBestMs: number | null = null
const sessions = new Map<number, MockSession>()

/**
 * Mock 서버 상태를 초기 상태로 되돌린다.
 * 테스트가 서로의 이용권 소진 결과에 영향을 받지 않도록 하기 위한 것으로,
 * 백엔드 연동 시 이 파일과 함께 사라진다.
 */
export function resetMockGameState() {
  remainingPassCount = MOCK_INITIAL_PASS_COUNT
  nextSessionId = 21
  personalBestMs = null
  sessions.clear()
}

/**
 * 카테고리별 출제 항목을 만든다.
 *
 * CH.02는 대학 이름 20개를 매 세션마다 새로 추첨한다. 추첨이 "서버" 쪽인
 * 이 핸들러 안에서 딱 한 번 일어나기 때문에, 화면이 몇 번 리렌더되든
 * 목록이 다시 섞이지 않는다.
 *
 * TODO: 백엔드 연동 시 제거 — 실제 서버가 sentences를 직접 내려준다.
 */
function buildSentences(categoryCode: string): SentenceDto[] {
  if (categoryCode === 'CH02') {
    return pickUniversities(CH02_ITEM_COUNT).map((name, index) => ({
      sequence: index + 1,
      content: name,
    }))
  }
  return MOCK_SENTENCES[categoryCode] ?? []
}

/* ---- 핸들러 ---- */

export const gameHandlers = [
  // GET /api/categories
  http.get(`${BASE_URL}/categories`, async () => {
    await delay(120)
    return HttpResponse.json(MOCK_CATEGORIES)
  }),

  // POST /api/game-sessions
  http.post(`${BASE_URL}/game-sessions`, async ({ request }) => {
    await delay(250)

    const { categoryId } = (await request.json()) as StartGameRequest
    const category = MOCK_CATEGORIES.find((item) => item.id === categoryId)
    if (!category) {
      return HttpResponse.json(
        { code: 'UNKNOWN', message: '존재하지 않는 카테고리입니다.' },
        { status: 400 },
      )
    }

    // 이용권이 없으면 세션을 만들지 않는다. 프론트는 이 응답을 보고 운영진 안내 화면으로 전환한다.
    if (remainingPassCount <= 0) {
      return HttpResponse.json(
        { code: 'NO_AVAILABLE_PASS', message: '사용 가능한 이용권이 없습니다.' },
        { status: 409 },
      )
    }
    remainingPassCount -= 1

    const gameSessionId = nextSessionId
    nextSessionId += 1
    sessions.set(gameSessionId, { categoryId, status: 'IN_PROGRESS', elapsedMs: null })

    const body: GameSessionResponse = {
      gameSessionId,
      category,
      sentences: buildSentences(category.code),
    }
    return HttpResponse.json(body)
  }),

  // POST /api/game-sessions/{id}/complete
  http.post(`${BASE_URL}/game-sessions/:gameSessionId/complete`, async ({ params, request }) => {
    await delay(400)

    const gameSessionId = Number(params.gameSessionId)
    const session = sessions.get(gameSessionId)

    // 이미 완료됐거나 무효화된 세션이면 기록을 덮어쓰지 않는다. (중복 제출 방어)
    if (!session || session.status !== 'IN_PROGRESS') {
      return HttpResponse.json(
        { code: 'INVALID_GAME_STATE', message: '이미 완료되었거나 유효하지 않은 경기입니다.' },
        { status: 409 },
      )
    }

    const { elapsedMs } = (await request.json()) as CompleteGameRequest
    session.status = 'COMPLETED'
    session.elapsedMs = elapsedMs

    // PB 판정은 Backend 권한이다. 프론트가 아니라 이 Mock "서버"가 계산한다는 점에 주의.
    const isPersonalBest = personalBestMs === null || elapsedMs < personalBestMs
    if (isPersonalBest) personalBestMs = elapsedMs

    const body: CompleteGameResponse = {
      elapsedMs,
      personalBestMs: personalBestMs ?? elapsedMs,
      personalBest: isPersonalBest,
      rank: 3,
    }
    return HttpResponse.json(body)
  }),

  // GET /api/game-sessions/{id} — complete 타임아웃 시 재조회용 (실제 연결은 TODO)
  http.get(`${BASE_URL}/game-sessions/:gameSessionId`, async ({ params }) => {
    await delay(150)

    const gameSessionId = Number(params.gameSessionId)
    const session = sessions.get(gameSessionId)
    if (!session) {
      return HttpResponse.json({ code: 'INVALID_GAME_STATE' }, { status: 409 })
    }

    return HttpResponse.json({
      gameSessionId,
      status: session.status,
      elapsedMs: session.elapsedMs,
      personalBestMs,
      personalBest: session.elapsedMs !== null && session.elapsedMs === personalBestMs,
      rank: session.status === 'COMPLETED' ? 3 : null,
    })
  }),
]

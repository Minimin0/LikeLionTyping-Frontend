/**
 * 게임 관련 API 요청 함수.
 * 컴포넌트는 이 함수를 직접 부르지 않고 hooks/useGameQueries.ts의 훅을 통해 사용한다.
 *   Component → Custom Hook → API Function → Axios → Backend
 */
import { apiClient } from '@/shared/api/apiClient'

import type {
  CategoryDto,
  CompleteGameRequest,
  CompleteGameResponse,
  GameSessionDetailResponse,
  GameSessionResponse,
  StartGameRequest,
} from '../types/game.types'

/** GET /api/categories — 카테고리는 프론트에 하드코딩하지 않고 항상 서버 응답을 쓴다. */
export async function fetchCategories(): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<CategoryDto[]>('/categories')
  return data
}

/**
 * POST /api/game-sessions
 * PlayPass 소비와 세션 생성이 함께 일어나므로, 이 요청이 게임 가능 여부의 최종 판단이다.
 * (프론트에서 availablePassCount만 보고 게임을 허용하면 안 된다)
 */
export async function startGame(body: StartGameRequest): Promise<GameSessionResponse> {
  const { data } = await apiClient.post<GameSessionResponse>('/game-sessions', body)
  return data
}

/**
 * POST /api/game-sessions/{id}/complete
 * 프론트가 보내는 값은 elapsedMs 하나뿐이고,
 * PB / rank / 공식 기록 인정 여부는 전부 응답(=Backend)에서 받아온다.
 */
export async function completeGame(
  gameSessionId: number,
  body: CompleteGameRequest,
): Promise<CompleteGameResponse> {
  const { data } = await apiClient.post<CompleteGameResponse>(
    `/game-sessions/${gameSessionId}/complete`,
    body,
  )
  return data
}

/**
 * GET /api/game-sessions/{id}
 * complete 요청이 타임아웃 났을 때 "기록이 저장됐는지" 확인하기 위한 재조회 API.
 * TODO: 백엔드와 스펙 확정 후 실제 호출부 연결 (현재는 함수 자리만 준비)
 */
export async function fetchGameSession(gameSessionId: number): Promise<GameSessionDetailResponse> {
  const { data } = await apiClient.get<GameSessionDetailResponse>(`/game-sessions/${gameSessionId}`)
  return data
}

import { ApiError, apiClient } from './client'
import type {
  AdminLogin,
  AdminDashboard,
  AdminParticipant,
  AdminParticipantSearchResult,
  Category,
  GameResult,
  GameStart,
  InvalidateResult,
  IssuePassResult,
  Participant,
  Ranking,
} from './types'

export const identifyParticipant = (nickname: string, phone: string) =>
  apiClient
    .post<Participant>('/participants/identify', { nickname, phone })
    .then(({ data }) => data)

export const getCategories = () =>
  apiClient.get<Category[]>('/categories').then(({ data }) => data)

export const startGame = (participantId: number, categoryId: number) =>
  apiClient
    .post<GameStart>('/game-sessions', { participantId, categoryId })
    .then(({ data }) => {
      // Backend 계약상 모든 카테고리는 정확히 5개 문장을 반환한다.
      // 잘못된 콘텐츠로 이용권이 소비된 채 게임이 시작되는 일을 막는다.
      if (!Array.isArray(data.sentences) || data.sentences.length !== 5)
        throw new ApiError('SENTENCE_CONTENT_INVALID', 409)
      return data
    })

export const getGame = (gameSessionId: number) =>
  apiClient
    .get<GameResult>(`/game-sessions/${gameSessionId}`)
    .then(({ data }) => data)

export const completeGame = (gameSessionId: number, elapsedMs: number) =>
  apiClient
    .post<GameResult>(`/game-sessions/${gameSessionId}/complete`, { elapsedMs })
    .then(({ data }) => data)

export const completeGameWithRecovery = async (
  gameSessionId: number,
  elapsedMs: number,
) => {
  try {
    return await completeGame(gameSessionId, elapsedMs)
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      !['NETWORK_ERROR', 'INVALID_GAME_STATE'].includes(error.code)
    )
      throw error
    try {
      const recovered = await getGame(gameSessionId)
      if (recovered.status === 'COMPLETED') return recovered
      if (recovered.status === 'INVALIDATED')
        throw new ApiError('INVALID_GAME_STATE', 409)
      throw new ApiError('COMPLETE_UNCERTAIN', 0)
    } catch (recoveryError) {
      if (
        recoveryError instanceof ApiError &&
        recoveryError.code !== 'NETWORK_ERROR'
      )
        throw recoveryError
      throw new ApiError('COMPLETE_UNCERTAIN', 0)
    }
  }
}

export const getRankings = (categoryId: number) =>
  apiClient
    .get<Ranking[]>('/rankings', { params: { categoryId } })
    .then(({ data }) => data)

export const adminLogin = (password: string) =>
  apiClient
    .post<AdminLogin>('/admin/login', { password })
    .then(({ data }) => data)

const auth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

export const getAdminDashboard = (token: string) =>
  apiClient
    .get<AdminDashboard>('/admin/dashboard', auth(token))
    .then(({ data }) => data)

export const findAdminParticipant = (token: string, phone: string) =>
  apiClient
    .get<AdminParticipant>('/admin/participants', {
      ...auth(token),
      params: { phone },
    })
    .then(({ data }) => data)

export const searchAdminParticipants = (token: string, query: string) =>
  apiClient
    .get<AdminParticipantSearchResult[]>('/admin/participants', {
      ...auth(token),
      params: { query },
    })
    .then(({ data }) => data)

export const issuePaidPass = (token: string, participantId: number, quantity = 1) =>
  apiClient
    .post<IssuePassResult>(
      `/admin/participants/${participantId}/passes`,
      { quantity },
      auth(token),
    )
    .then(({ data }) => data)

export const invalidateGame = (
  token: string,
  gameSessionId: number,
  restorePass: boolean,
  reason = '',
) =>
  apiClient
    .post<InvalidateResult>(
      `/admin/game-sessions/${gameSessionId}/invalidate`,
      { restorePass, reason },
      auth(token),
    )
    .then(({ data }) => data)

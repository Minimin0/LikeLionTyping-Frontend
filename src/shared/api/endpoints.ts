import { ApiError, apiClient } from './client'
import type {
  AdminLogin,
  AdminParticipant,
  Category,
  GameResult,
  GameStart,
  InvalidateResult,
  Participant,
  PlayPass,
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
      // 문장 개수는 카테고리마다 달라질 수 있다.
      // 개수를 고정하면 백엔드가 콘텐츠를 조정했을 때 게임 시작이 막힌다.
      if (!Array.isArray(data.sentences) || data.sentences.length === 0)
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

export const findAdminParticipant = (token: string, phone: string) =>
  apiClient
    .get<AdminParticipant>('/admin/participants', {
      ...auth(token),
      params: { phone },
    })
    .then(({ data }) => data)

export const issuePaidPass = (token: string, participantId: number) =>
  apiClient
    .post<PlayPass>(
      `/admin/participants/${participantId}/passes`,
      undefined,
      auth(token),
    )
    .then(({ data }) => data)

export const invalidateGame = (
  token: string,
  gameSessionId: number,
  restorePass: boolean,
) =>
  apiClient
    .post<InvalidateResult>(
      `/admin/game-sessions/${gameSessionId}/invalidate`,
      { restorePass },
      auth(token),
    )
    .then(({ data }) => data)

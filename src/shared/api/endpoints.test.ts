import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient } from './client'
import { completeGameWithRecovery, startGame } from './endpoints'

afterEach(() => vi.restoreAllMocks())

describe('API integration guards', () => {
  it('rejects a game payload that does not contain exactly five sentences', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        gameSessionId: 1,
        category: { id: 1, code: 'CH01', name: 'Test' },
        sentences: [],
      },
    })
    await expect(startGame(1, 1)).rejects.toMatchObject({
      code: 'SENTENCE_CONTENT_INVALID',
    })
  })

  it('recovers a completed result after the complete response is lost', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new ApiError('NETWORK_ERROR', 0),
    )
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        gameSessionId: 3,
        status: 'COMPLETED',
        elapsedMs: 1234,
        personalBestMs: 1234,
        personalBest: true,
        rank: 1,
      },
    })
    await expect(completeGameWithRecovery(3, 1234)).resolves.toMatchObject({
      status: 'COMPLETED',
      elapsedMs: 1234,
    })
  })
})

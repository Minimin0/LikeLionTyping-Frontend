import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider } from '../../app/session'
import { ApiError, apiClient } from '../../shared/api/client'
import { GamePage } from './GamePage'

const participant = (availablePassCount: number) => ({
  participantId: 1,
  nickname: '노태경',
  isNewParticipant: false,
  availablePassCount,
})

const gameStart = {
  gameSessionId: 11,
  category: { id: 1, code: 'CH01', name: '성결 멋사 ON AIR' },
  sentences: [
    { sequence: 1, content: '하나' },
    { sequence: 2, content: '둘' },
    { sequence: 3, content: '셋' },
    { sequence: 4, content: '넷' },
    { sequence: 5, content: '다섯' },
  ],
  resumedExisting: false,
  passConsumed: true,
  availablePassCount: 1,
}

function mockGet(availablePassCount: number, activeGame: null | { gameSessionId: number; categoryId: number } = null) {
  return vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    if (url === '/categories')
      return Promise.resolve({
        data: [{ id: 1, code: 'CH01', name: '성결 멋사 ON AIR' }],
      })
    if (url === '/participants/1/play-state')
      return Promise.resolve({ data: { availablePassCount, activeGame } })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/game/1']}>
        <SessionProvider>
          <Routes>
            <Route path="/game/:categoryId" element={<GamePage />} />
            <Route path="/participate" element={<div>참가자 확인</div>} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('GamePage pass count', () => {
  it('stores the server pass count after game start succeeds', async () => {
    mockGet(5)
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...gameStart, availablePassCount: 1 },
    })
    sessionStorage.setItem('participant', JSON.stringify(participant(5)))

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '게임 시작' }))

    await waitFor(() => {
      expect(
        JSON.parse(sessionStorage.getItem('participant') ?? '{}'),
      ).toMatchObject({ availablePassCount: 1 })
    })
  })

  it('keeps the participant pass count when game start fails', async () => {
    mockGet(2)
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('start failed'))
    sessionStorage.setItem('participant', JSON.stringify(participant(2)))

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '게임 시작' }))

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled()
    })
    expect(JSON.parse(sessionStorage.getItem('participant') ?? '{}')).toMatchObject({
      availablePassCount: 2,
    })
  })

  it('does not render normal start when there are zero passes and no active game', async () => {
    mockGet(0)
    vi.spyOn(apiClient, 'post')
    sessionStorage.setItem('participant', JSON.stringify(participant(0)))

    renderPage()

    expect(await screen.findByText(/사용 가능한 이용권이 없습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '게임 시작' })).not.toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('allows continuing an active game with zero passes', async () => {
    mockGet(0, { gameSessionId: 11, categoryId: 1 })
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        ...gameStart,
        resumedExisting: true,
        passConsumed: false,
        availablePassCount: 0,
      },
    })
    sessionStorage.setItem('participant', JSON.stringify(participant(0)))

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '진행 중 경기 계속하기' }))

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/game-sessions', {
        participantId: 1,
        categoryId: 1,
      })
    })
    expect(JSON.parse(sessionStorage.getItem('participant') ?? '{}')).toMatchObject({
      availablePassCount: 0,
    })
  })

  it('handles NO_AVAILABLE_PASS without creating an active game', async () => {
    let playStateCalls = 0
    vi.spyOn(apiClient, 'get').mockImplementation((url) => {
      if (url === '/categories')
        return Promise.resolve({
          data: [{ id: 1, code: 'CH01', name: '성결 멋사 ON AIR' }],
        })
      if (url === '/participants/1/play-state') {
        playStateCalls += 1
        return Promise.resolve({
          data: { availablePassCount: playStateCalls > 1 ? 0 : 1, activeGame: null },
        })
      }
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new ApiError('NO_AVAILABLE_PASS', 409),
    )
    sessionStorage.setItem('participant', JSON.stringify(participant(1)))

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '게임 시작' }))

    expect(await screen.findByText(/사용 가능한 이용권이 없습니다/)).toBeInTheDocument()
    expect(sessionStorage.getItem('activeGame')).toBeNull()
    expect(JSON.parse(sessionStorage.getItem('participant') ?? '{}')).toMatchObject({
      availablePassCount: 0,
    })
  })
})

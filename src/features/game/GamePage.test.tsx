import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

let audioInstances: { play: ReturnType<typeof vi.fn> }[] = []

beforeEach(() => {
  audioInstances = []
  class FakeAudio {
    currentTime = 0
    preload = ''
    volume = 1
    play = vi.fn(() => Promise.resolve())

    constructor() {
      audioInstances.push(this)
    }
  }
  vi.stubGlobal('Audio', FakeAudio)
})

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
            <Route path="/categories" element={<div>카테고리 선택</div>} />
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
  vi.unstubAllGlobals()
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

  it('shows participant nickname and authoritative remaining passes before starting a game', async () => {
    mockGet(2)
    sessionStorage.setItem('participant', JSON.stringify(participant(5)))

    renderPage()

    const status = await screen.findByLabelText('현재 참가자')
    expect(status).toHaveTextContent('노태경 님')
    expect(status).toHaveTextContent('남은 이용권 2장')
    expect(status).not.toHaveTextContent('010')
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

  it('confirms before exiting an uncompleted game', async () => {
    mockGet(5)
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...gameStart, availablePassCount: 1 },
    })
    sessionStorage.setItem('participant', JSON.stringify(participant(5)))

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '게임 시작' }))
    await userEvent.click(await screen.findByRole('button', { name: '게임 종료' }))

    expect(screen.getByRole('dialog', { name: '게임을 종료할까요?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '계속하기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '게임 종료' }))
    await userEvent.click(screen.getByRole('button', { name: '종료하기' }))
    expect(await screen.findByText('카테고리 선택')).toBeInTheDocument()
  })

  it('moves the broadcast progress only after a sentence is completed', async () => {
    mockGet(1)
    sessionStorage.setItem('participant', JSON.stringify(participant(1)))
    sessionStorage.setItem(
      'activeGame',
      JSON.stringify({ ...gameStart, currentIndex: 0, startedAtMs: performance.timeOrigin }),
    )

    const { container } = renderPage()

    const progress = await screen.findByLabelText('문장 진행 단계')
    expect(progress.querySelector('.is-active span')).toHaveTextContent('1')

    await userEvent.type(screen.getByLabelText('타이핑 입력창'), '하나{Enter}')

    await waitFor(() => {
      expect(container.querySelector('.broadcast-progress .is-active span')).toHaveTextContent('2')
    })
  })

  it('does not play typing sounds before PLAYING', async () => {
    mockGet(1)
    sessionStorage.setItem('participant', JSON.stringify(participant(1)))
    sessionStorage.setItem(
      'activeGame',
      JSON.stringify({ ...gameStart, currentIndex: 0, startedAtMs: null }),
    )

    renderPage()
    await screen.findByRole('button', { name: '3초 카운트다운 시작' })
    fireEvent.keyDown(window, { code: 'KeyA' })

    expect(audioInstances).toHaveLength(0)
  })
})

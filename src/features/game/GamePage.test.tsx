import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider } from '../../app/session'
import { apiClient } from '../../shared/api/client'
import { GamePage } from './GamePage'

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
  it('deducts one available pass from the participant session after game start succeeds', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [{ id: 1, code: 'CH01', name: '성결 멋사 ON AIR' }],
    })
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        gameSessionId: 11,
        category: { id: 1, code: 'CH01', name: '성결 멋사 ON AIR' },
        sentences: [
          { sequence: 1, content: '하나' },
          { sequence: 2, content: '둘' },
          { sequence: 3, content: '셋' },
          { sequence: 4, content: '넷' },
          { sequence: 5, content: '다섯' },
        ],
      },
    })
    sessionStorage.setItem(
      'participant',
      JSON.stringify({
        participantId: 1,
        nickname: '노태경',
        isNewParticipant: false,
        availablePassCount: 2,
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '게임 시작' }))

    await waitFor(() => {
      expect(
        JSON.parse(sessionStorage.getItem('participant') ?? '{}'),
      ).toMatchObject({ availablePassCount: 1 })
    })
  })
})

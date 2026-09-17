import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../shared/api/client'
import { ResultPage } from './ResultPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ResultPage', () => {
  it('직접 진입해 location.state가 없어도 서버에서 결과를 조회한다', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        gameSessionId: 4,
        status: 'COMPLETED',
        elapsedMs: 42000,
        personalBestMs: 42000,
        personalBest: true,
        rank: 2,
      },
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/result/4']}>
          <Routes>
            <Route path="/result/:gameSessionId" element={<ResultPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('방송 완료')).toBeInTheDocument()
    expect(screen.getAllByText('42.000초')).toHaveLength(2)
  })
})

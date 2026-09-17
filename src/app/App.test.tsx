import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../shared/api/client'
import App from './App'
import { SessionProvider } from './session'

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <SessionProvider>
          <App />
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

describe('App home participant status', () => {
  it('does not show participant status on anonymous Home', () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] })

    renderApp()

    expect(screen.queryByText(/님$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/남은 이용권/)).not.toBeInTheDocument()
  })

  it('shows nickname and remaining passes for an identified participant on Home', () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] })
    sessionStorage.setItem(
      'participant',
      JSON.stringify({
        participantId: 1,
        nickname: '노태경',
        isNewParticipant: false,
        availablePassCount: 2,
      }),
    )

    renderApp()

    expect(screen.getByText('노태경 님')).toBeInTheDocument()
    expect(screen.getByText('남은 이용권 2장')).toBeInTheDocument()
  })
})

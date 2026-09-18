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

function mockHomeGets(availablePassCount = 3) {
  return vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    if (url === '/participants/1/play-state')
      return Promise.resolve({ data: { availablePassCount, activeGame: null } })
    if (url === '/categories') return Promise.resolve({ data: [] })
    if (url === '/rankings') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('App home participant status', () => {
  it('does not show participant status on anonymous Home', () => {
    mockHomeGets()

    renderApp()

    expect(screen.queryByText(/님$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/남은 이용권/)).not.toBeInTheDocument()
  })

  it('shows nickname and remaining passes for an identified participant on Home', async () => {
    mockHomeGets(3)
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
    expect(await screen.findByText('남은 이용권 3장')).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('participant') ?? '{}')).toMatchObject({
      availablePassCount: 3,
    })
  })

  it('does not render phone on identified Home', async () => {
    mockHomeGets(3)
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

    expect(await screen.findByText('남은 이용권 3장')).toBeInTheDocument()
    expect(screen.queryByText(/010/)).not.toBeInTheDocument()
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../shared/api/client'
import { apiClient } from '../shared/api/client'
import App from './App'
import { SessionProvider } from './session'

function renderApp(initialEntries = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
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

describe('App admin payment navigation auth', () => {
  it('keeps the admin token from dashboard to payment history', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { token: 'admin-token', expiresAt: '2026-09-20T00:00:00Z' },
    })
    const get = mockAdminGets()
    const user = userEvent.setup()
    renderApp(['/admin'])

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    const paymentLink = await screen.findByRole('link', { name: /결제 합계/ })

    await user.click(paymentLink)

    expect(post).toHaveBeenCalledWith('/admin/login', { password: 'admin' })
    expect(await screen.findByRole('heading', { name: '결제 현황' })).toBeInTheDocument()
    expect(screen.queryByText('운영진 로그인이 필요합니다')).not.toBeInTheDocument()
    expect(screen.getByText('21,000원')).toBeInTheDocument()
    expect(screen.getByText('7건')).toBeInTheDocument()
    expect(screen.getByText('42회')).toBeInTheDocument()
    expect(screen.getByText('민민')).toBeInTheDocument()
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('1,000원')).toBeInTheDocument()
    expect(screen.getByText('+2회')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/admin/payments', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('restores admin auth after a payment page remount and clears it on logout or expiry', async () => {
    const get = mockAdminGets()
    sessionStorage.setItem('likelion-admin-token', 'admin-token')
    const user = userEvent.setup()
    const rendered = renderApp(['/admin/payments'])

    expect(await screen.findByRole('heading', { name: '결제 현황' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /운영자 콘솔/ }))
    expect(await screen.findByRole('heading', { name: '참가자 관리' })).toBeInTheDocument()
    expect(screen.queryByText('운영진 로그인')).not.toBeInTheDocument()
    await user.click(screen.getByTitle('로그아웃'))
    expect(sessionStorage.getItem('likelion-admin-token')).toBeNull()

    rendered.unmount()
    sessionStorage.setItem('likelion-admin-token', 'expired-token')
    get.mockRejectedValueOnce(new ApiError('ADMIN_UNAUTHORIZED', 403))
    renderApp(['/admin/payments'])

    expect(await screen.findByText('운영진 로그인이 필요합니다')).toBeInTheDocument()
    expect(sessionStorage.getItem('likelion-admin-token')).toBeNull()
  })
})

describe('App admin participant navigation auth', () => {
  it('keeps the admin token from dashboard to participant history', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { token: 'admin-token', expiresAt: '2026-09-20T00:00:00Z' },
    })
    const get = mockAdminGets()
    const user = userEvent.setup()
    renderApp(['/admin'])

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    const participantLink = await screen.findByRole('link', { name: /^참가자\s*2/ })

    await user.click(participantLink)

    expect(post).toHaveBeenCalledWith('/admin/login', { password: 'admin' })
    expect(await screen.findByRole('heading', { name: '참가자 현황' })).toBeInTheDocument()
    expect(screen.queryByText('운영진 로그인이 필요합니다')).not.toBeInTheDocument()
    expect(screen.getByText('2명')).toBeInTheDocument()
    expect(screen.getByText('민민')).toBeInTheDocument()
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/admin/participants/all', {
      headers: { Authorization: 'Bearer admin-token' },
    })

    await user.click(screen.getByRole('link', { name: /운영자 콘솔/ }))
    expect(await screen.findByRole('heading', { name: '참가자 관리' })).toBeInTheDocument()
    expect(screen.queryByText('운영진 로그인')).not.toBeInTheDocument()
  })
})

function mockAdminGets() {
  return vi.spyOn(apiClient, 'get').mockImplementation((url, config) => {
    if (url === '/admin/dashboard')
      return Promise.resolve({
        data: {
          totalParticipants: 2,
          totalPlayCount: 3,
          freePlayCount: 2,
          paidPlayCount: 1,
          totalPaymentAmountKrw: 21000,
          availablePaidPassCount: 4,
          ch01PlayCount: 1,
          ch02PlayCount: 1,
          ch03PlayCount: 1,
          completedGameCount: 2,
          invalidatedGameCount: 1,
        },
      })
    if (url === '/admin/payments')
      return Promise.resolve({
        data: {
          totalPaymentAmountKrw: 21000,
          totalPaymentCount: 7,
          totalPaidPassQuantity: 42,
          payments: [
            {
              id: 1,
              participantId: 10,
              nickname: '민민',
              phone: '01012345678',
              quantity: 2,
              amountKrw: 1000,
              createdAt: '2026-09-19T14:42:00Z',
            },
          ],
        },
      })
    if (url === '/admin/participants/all')
      return Promise.resolve({
        data: {
          totalParticipants: 2,
          participants: [
            {
              id: 10,
              nickname: '민민',
              phone: '01012345678',
              createdAt: '2026-09-20T06:42:00Z',
            },
            {
              id: 9,
              nickname: '아기사자',
              phone: '01098765432',
              createdAt: '2026-09-20T06:39:00Z',
            },
          ],
        },
      })
    return Promise.reject(new Error(`unexpected GET ${url} ${JSON.stringify(config)}`))
  })
}

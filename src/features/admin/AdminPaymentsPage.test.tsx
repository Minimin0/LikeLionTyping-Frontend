import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { ApiError, apiClient } from '../../shared/api/client'
import { AdminAuthProvider, useAdminAuth } from './AdminAuth'
import { AdminPaymentsPage } from './AdminPaymentsPage'

function TokenSeed({ token = 'admin-token' }: { token?: string }) {
  const { setToken } = useAdminAuth()
  useEffect(() => setToken(token), [setToken, token])
  return null
}

function renderPage(token = 'admin-token') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminAuthProvider>
          {token && <TokenSeed token={token} />}
          <AdminPaymentsPage />
        </AdminAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('AdminPaymentsPage', () => {
  it('shows payment summary, rows, masked phones, and console link', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: history([
        {
          id: 2,
          participantId: 20,
          nickname: '민민',
          phone: '01012345678',
          quantity: 2,
          amountKrw: 1000,
          createdAt: '2026-09-19T14:42:00Z',
        },
      ]),
    })

    renderPage()

    expect(await screen.findAllByText('1,000원')).toHaveLength(2)
    expect(screen.getByText('1건')).toBeInTheDocument()
    expect(screen.getByText('2회')).toBeInTheDocument()
    expect(screen.getByText('민민')).toBeInTheDocument()
    expect(screen.getByText('010-****-5678')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /운영자 콘솔/ })).toHaveAttribute(
      'href',
      '/admin',
    )
  })

  it('shows an empty state', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: history([]) })

    renderPage()

    expect(await screen.findByText('0원')).toBeInTheDocument()
    expect(screen.getByText('0건')).toBeInTheDocument()
    expect(screen.getByText('0회')).toBeInTheDocument()
    expect(screen.getByText('아직 등록된 결제 기록이 없습니다.')).toBeInTheDocument()
  })

  it('shows loading and error states', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new ApiError('NETWORK_ERROR', 0))

    renderPage()

    expect(screen.getByText(/결제 현황을 불러오는 중/)).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결할 수 없습니다')
  })

  it('refetches with the refresh button', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: history([]) })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('0원')
    await user.click(screen.getByRole('button', { name: /새로고침/ }))

    expect(get).toHaveBeenCalledTimes(2)
  })

  it('asks for login without an admin token', () => {
    renderPage('')

    expect(screen.getByText('운영진 로그인이 필요합니다')).toBeInTheDocument()
  })
})

type PaymentFixture = {
  id: number
  participantId: number
  nickname: string
  phone: string
  amountKrw: number
  quantity: number
  createdAt: string
}

function history(payments: PaymentFixture[]) {
  return {
    totalPaymentAmountKrw: payments.reduce((sum, payment) => sum + payment.amountKrw, 0),
    totalPaymentCount: payments.length,
    totalPaidPassQuantity: payments.reduce((sum, payment) => sum + payment.quantity, 0),
    payments,
  }
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { apiClient } from '../../shared/api/client'
import { AdminAuthProvider } from './AdminAuth'
import { AdminPage } from './AdminPage'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminAuthProvider>
          <AdminPage />
        </AdminAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AdminPage', () => {
  it('searches by nickname and lets staff choose among multiple results', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { token: 'admin-token', expiresAt: '2026-09-17T00:00:00Z' },
    })
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => ({
      data: url.includes('dashboard')
        ? dashboard()
        : [
            participant(1, '사자왕', '01011112222'),
            participant(2, '사자님', '01033334444'),
          ],
    }))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    await user.type(await screen.findByPlaceholderText('전화번호 또는 닉네임'), '사자')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await user.click(await screen.findByRole('button', { name: /사자님/ }))

    expect(screen.getByText('사자님')).toBeInTheDocument()
    expect(screen.getByText(/01033334444/)).toBeInTheDocument()
    expect(screen.getByText('참가자')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /결제 합계/ })).toHaveAttribute(
      'href',
      '/admin/payments',
    )
  })

  it('shows an empty state when no participant matches', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { token: 'admin-token', expiresAt: '2026-09-17T00:00:00Z' },
    })
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => ({
      data: url.includes('dashboard') ? dashboard() : [],
    }))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    await user.type(await screen.findByPlaceholderText('전화번호 또는 닉네임'), '없음')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('changes paid quantity and shows server-priced amount', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { token: 'admin-token', expiresAt: '2026-09-17T00:00:00Z' },
    })
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => ({
      data: url.includes('dashboard')
        ? dashboard()
        : [participant(1, '사자왕', '01011112222')],
    }))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    await user.type(await screen.findByPlaceholderText('전화번호 또는 닉네임'), '사자')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await user.click(await screen.findByRole('button', { name: '발급 수량 증가' }))

    expect(screen.getByText('2회')).toBeInTheDocument()
    expect(screen.getAllByText('1,000원').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: '발급 수량 감소' }))
    await user.click(screen.getByRole('button', { name: '발급 수량 감소' }))
    expect(screen.getByText('1회')).toBeInTheDocument()
  })
})

function dashboard() {
  return {
    totalParticipants: 2,
    totalPlayCount: 3,
    freePlayCount: 2,
    paidPlayCount: 1,
    totalPaymentAmountKrw: 1000,
    availablePaidPassCount: 2,
    ch01PlayCount: 1,
    ch02PlayCount: 1,
    ch03PlayCount: 1,
    completedGameCount: 2,
    invalidatedGameCount: 1,
  }
}

function participant(id: number, nickname: string, phone: string) {
  return {
    id,
    nickname,
    phone,
    passes: [],
    gameSessions: [],
    payments: [{ id: 1, quantity: 2, amountKrw: 1000, createdAt: '2026-09-17T01:12:00Z' }],
    summary: {
      freeParticipationUsed: true,
      availablePassCount: 2,
      availablePaidPassCount: 2,
      totalPlayCount: 3,
      completedGameCount: 2,
      invalidatedGameCount: 1,
      totalPaymentAmountKrw: 1000,
      bestRecords: [
        { categoryCode: 'CH01', elapsedMs: 5000 },
        { categoryCode: 'CH02', elapsedMs: null },
        { categoryCode: 'CH03', elapsedMs: null },
      ],
    },
  }
}

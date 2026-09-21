import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient } from '../../shared/api/client'
import { AdminAuthProvider, useAdminAuth } from './AdminAuth'
import { AdminParticipantsPage } from './AdminParticipantsPage'

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
          <AdminParticipantsPage />
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

describe('AdminParticipantsPage', () => {
  it('shows participant summary, rows, full phones, and console link', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: history([
        {
          id: 2,
          nickname: '민민',
          phone: '01012345678',
          createdAt: '2026-09-20T06:42:00Z',
        },
      ]),
    })

    renderPage()

    expect(await screen.findByText('1명')).toBeInTheDocument()
    expect(screen.getByText('참가자 목록')).toBeInTheDocument()
    expect(screen.getAllByText('민민')).toHaveLength(2)
    expect(screen.getAllByText('010-1234-5678')).toHaveLength(2)
    expect(screen.getAllByText(/오.|[0-9]{2}:/).length).toBeGreaterThanOrEqual(
      2,
    )
    expect(screen.getByRole('link', { name: /운영자 콘솔/ })).toHaveAttribute(
      'href',
      '/admin',
    )
  })

  it('shows an empty state', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: history([]) })

    renderPage()

    expect(await screen.findByText('0명')).toBeInTheDocument()
    expect(
      screen.getByText('아직 등록된 참가자가 없습니다.'),
    ).toBeInTheDocument()
  })

  it('shows loading and error states', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(
      new ApiError('NETWORK_ERROR', 0),
    )

    renderPage()

    expect(screen.getByText(/참가자 현황을 불러오는 중/)).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '서버에 연결할 수 없습니다',
    )
  })

  it('refetches with the refresh button', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: history([]) })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('0명')
    await user.click(screen.getByRole('button', { name: /새로고침/ }))

    expect(get).toHaveBeenCalledTimes(2)
  })

  it('asks for login without an admin token', () => {
    renderPage('')

    expect(screen.getByText('운영진 로그인이 필요합니다')).toBeInTheDocument()
  })
})

type ParticipantFixture = {
  id: number
  nickname: string
  phone: string
  createdAt: string
}

function history(participants: ParticipantFixture[]) {
  return {
    totalParticipants: participants.length,
    participants,
  }
}

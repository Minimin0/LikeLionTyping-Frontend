import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../shared/api/client'
import { AdminPage } from './AdminPage'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminPage />
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
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [
        participant(1, '사자왕', '01011112222'),
        participant(2, '사자님', '01033334444'),
      ],
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    await user.type(await screen.findByPlaceholderText('전화번호 또는 닉네임'), '사자')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await user.click(await screen.findByRole('button', { name: /사자님/ }))

    expect(screen.getByText('사자님')).toBeInTheDocument()
    expect(screen.getByText(/01033334444/)).toBeInTheDocument()
  })

  it('shows an empty state when no participant matches', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { token: 'admin-token', expiresAt: '2026-09-17T00:00:00Z' },
    })
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('관리자 비밀번호'), 'admin')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    await user.type(await screen.findByPlaceholderText('전화번호 또는 닉네임'), '없음')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })
})

function participant(id: number, nickname: string, phone: string) {
  return {
    id,
    nickname,
    phone,
    passes: [],
    gameSessions: [],
  }
}

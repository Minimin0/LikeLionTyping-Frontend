import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider } from '../../app/session'
import { apiClient } from '../../shared/api/client'
import { CategoriesPage } from './CategoriesPage'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/categories']}>
        <SessionProvider>
          <CategoriesPage />
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  sessionStorage.setItem(
    'participant',
    JSON.stringify({
      participantId: 1,
      nickname: '타자왕',
      isNewParticipant: true,
      availablePassCount: 1,
    }),
  )
})
afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('CategoriesPage — 응답 형태 방어', () => {
  it('data가 배열이 아니어도 throw하지 않고 빈 상태를 보여준다', async () => {
    // 인터셉터를 뚫고 온 비정상 JSON(객체)을 흉내낸다
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { html: '<!doctype>' },
    })

    expect(() => renderPage()).not.toThrow()

    expect(
      await screen.findByText('카테고리를 불러오지 못했습니다'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })

  it('로딩 중에는 빈 상태 안내가 뜨지 않는다', () => {
    vi.spyOn(apiClient, 'get').mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByText('불러오는 중')).toBeInTheDocument()
    expect(
      screen.queryByText('카테고리를 불러오지 못했습니다'),
    ).not.toBeInTheDocument()
  })

  it('정상 배열이면 카테고리 버튼이 렌더된다', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [{ id: 1, code: 'CH01', name: '성결대 멋사' }],
    })
    renderPage()

    expect(
      await screen.findByRole('button', { name: /성결대 멋사/ }),
    ).toBeInTheDocument()
  })
})

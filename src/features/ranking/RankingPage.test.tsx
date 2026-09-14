import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../shared/api/client'
import { RankingPage } from './RankingPage'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/rankings?categoryId=1']}>
        <RankingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('RankingPage — 응답 형태 방어', () => {
  it('data가 배열이 아니어도 throw하지 않고 빈 상태를 보여준다', async () => {
    // 카테고리·랭킹 둘 다 비정상 JSON(객체)이 온 상황
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { html: '<!doctype>' },
    })

    expect(() => renderPage()).not.toThrow()

    expect(await screen.findByText('아직 기록이 없습니다')).toBeInTheDocument()
  })

  it('로딩 중에는 "기록이 없습니다"가 뜨지 않는다', () => {
    vi.spyOn(apiClient, 'get').mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByText('랭킹 확인 중')).toBeInTheDocument()
    expect(screen.queryByText('아직 기록이 없습니다')).not.toBeInTheDocument()
  })

  it('정상 배열이면 순위·닉네임·기록만 표시한다', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) =>
      url.includes('rankings')
        ? { data: [{ rank: 1, nickname: '사자왕', elapsedMs: 36120 }] }
        : { data: [{ id: 1, code: 'CH01', name: '성결대 멋사' }] },
    )
    renderPage()

    expect(await screen.findByText('사자왕')).toBeInTheDocument()
    expect(screen.getByText('36.120초')).toBeInTheDocument()
  })
})

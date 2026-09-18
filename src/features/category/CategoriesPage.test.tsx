import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function mockGets(
  categoriesData: unknown = [{ id: 1, code: 'CH01', name: '성결대 멋사' }],
  playState: unknown = { availablePassCount: 1, activeGame: null },
) {
  return vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    if (url === '/categories') return Promise.resolve({ data: categoriesData })
    if (url === '/participants/1/play-state')
      return Promise.resolve({ data: playState })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
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
    mockGets({ html: '<!doctype>' })

    expect(() => renderPage()).not.toThrow()

    expect(
      await screen.findByText('카테고리를 불러오지 못했습니다'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })

  it('로딩 중에는 빈 상태 안내가 뜨지 않는다', () => {
    vi.spyOn(apiClient, 'get').mockImplementation((url) =>
      url === '/categories'
        ? new Promise(() => {})
        : Promise.resolve({ data: { availablePassCount: 1, activeGame: null } }),
    )
    renderPage()

    expect(screen.getByText('불러오는 중')).toBeInTheDocument()
    expect(
      screen.queryByText('카테고리를 불러오지 못했습니다'),
    ).not.toBeInTheDocument()
  })

  it('정상 배열이면 카테고리 버튼이 렌더된다', async () => {
    mockGets()
    renderPage()

    expect(
      await screen.findByRole('button', { name: /성결대 멋사/ }),
    ).toBeInTheDocument()
  })

  it('0 passes and no active game disables normal start', async () => {
    mockGets([{ id: 1, code: 'CH01', name: '성결대 멋사' }], {
      availablePassCount: 0,
      activeGame: null,
    })
    renderPage()

    expect(await screen.findByText(/사용 가능한 이용권이 없습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /이 테마로 시작/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이용권 다시 확인' })).toBeInTheDocument()
  })

  it('0 passes with an active game shows continue semantics', async () => {
    mockGets([{ id: 1, code: 'CH01', name: '성결대 멋사' }], {
      availablePassCount: 0,
      activeGame: { gameSessionId: 11, categoryId: 1 },
    })
    renderPage()

    expect(await screen.findByText(/진행 중인 경기가 있습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /진행 중 경기 계속하기/ })).toBeInTheDocument()
  })

  it('refreshes externally issued passes', async () => {
    const get = mockGets([{ id: 1, code: 'CH01', name: '성결대 멋사' }], {
      availablePassCount: 0,
      activeGame: null,
    })
    get.mockImplementationOnce((url) =>
      url === '/categories'
        ? Promise.resolve({ data: [{ id: 1, code: 'CH01', name: '성결대 멋사' }] })
        : Promise.resolve({ data: { availablePassCount: 0, activeGame: null } }),
    ).mockImplementationOnce((url) =>
      url === '/participants/1/play-state'
        ? Promise.resolve({ data: { availablePassCount: 0, activeGame: null } })
        : Promise.resolve({ data: [{ id: 1, code: 'CH01', name: '성결대 멋사' }] }),
    ).mockImplementation((url) =>
      url === '/participants/1/play-state'
        ? Promise.resolve({ data: { availablePassCount: 2, activeGame: null } })
        : Promise.resolve({ data: [{ id: 1, code: 'CH01', name: '성결대 멋사' }] }),
    )
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: '이용권 다시 확인' }))

    expect(await screen.findByRole('button', { name: /이 테마로 시작/ })).toBeInTheDocument()
  })
})

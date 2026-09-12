// 채널 전환, 빈 기록, 실패 복구 및 전화번호 미노출을 검증한다.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { routes } from '@/app/router/routes'
import { server } from '@/mocks/server'
import { RankingList, formatRankingTime } from './components/RankingList'
function setup(path = '/ranking') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}
describe('공개 랭킹', () => {
  it('완료 시간을 SS.mmm 단위로 표시한다', () => {
    expect(formatRankingTime(36120)).toBe('36.120')
    expect(formatRankingTime(60001)).toBe('60.001')
  })
  it('응답의 전화번호를 렌더링하지 않는다', () => {
    const entries = [{ rank: 1, nickname: '공개이름', elapsedMs: 43821, phone: '01012345678' }]
    render(<RankingList entries={entries} />)
    expect(screen.getByText('공개이름')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('01012345678')
  })
  it('빈 목록을 안내한다', () => {
    render(<RankingList entries={[]} />)
    expect(screen.getByText('아직 기록이 없습니다')).toBeInTheDocument()
  })
  it('서버 채널 목록으로 세 카테고리를 전환한다', async () => {
    const user = setup()
    expect(await screen.findByText('사자왕')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /CH02/ }))
    expect(await screen.findByText('개발사자')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /CH03/ }))
    expect(await screen.findByText('아직 기록이 없습니다')).toBeInTheDocument()
  })
  it('categoryId 직접 링크를 지원한다', async () => {
    setup('/ranking?categoryId=2')
    expect(await screen.findByText('개발사자')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /CH02/ })).toHaveAttribute('aria-pressed', 'true')
  })
  it('유효하지 않은 categoryId는 첫 채널을 표시한다', async () => {
    setup('/ranking?categoryId=unknown')
    expect(await screen.findByText('사자왕')).toBeInTheDocument()
  })
  it('랭킹 실패 후 다시 시도해 복구한다', async () => {
    server.use(http.get('*/api/rankings', () => HttpResponse.json({}, { status: 500 })))
    const user = setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('랭킹을 불러오지 못했습니다')
    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('사자왕')).toBeInTheDocument()
  })
  it('카테고리 조회 실패를 안내한다', async () => {
    server.use(http.get('*/api/categories', () => HttpResponse.json({}, { status: 500 })))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('채널을 불러오지 못했습니다')
  })
  it('카테고리가 없을 때 랭킹 요청 없이 안내한다', async () => {
    server.use(http.get('*/api/categories', () => HttpResponse.json([])))
    setup()
    expect(await screen.findByText('아직 등록된 채널이 없습니다.')).toBeInTheDocument()
  })
})

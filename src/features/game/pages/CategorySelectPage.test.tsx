/**
 * 채널 선택 화면 테스트.
 * 정상 선택보다 실패 케이스(시작 연타 / 이용권 소진) 검증에 무게를 둔다.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'

import { MOCK_CATEGORIES } from '../constants/mockSentences'
import { CategorySelectPage } from './CategorySelectPage'

let startGameCallCount = 0

const categoriesHandler = http.get('*/categories', () => HttpResponse.json(MOCK_CATEGORIES))

const server = setupServer(categoriesHandler)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers(categoriesHandler))
afterAll(() => server.close())

beforeEach(() => {
  startGameCallCount = 0
})

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/game/category']}>
        <Routes>
          <Route path="/game/category" element={<CategorySelectPage />} />
          <Route path="/game/play" element={<p>게임 화면</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('CategorySelectPage', () => {
  it('채널을 선택해야 시작할 수 있다', async () => {
    renderPage()
    await screen.findByRole('button', { name: /성결대 멋사/ })

    expect(screen.getByRole('button', { name: '방송 참여하기' })).toBeDisabled()
  })

  it('시작 버튼을 연타해도 GameSession 생성 요청은 한 번만 나간다', async () => {
    server.use(
      http.post('*/game-sessions', async () => {
        startGameCallCount += 1
        await delay(100)
        return HttpResponse.json({
          gameSessionId: 21,
          category: MOCK_CATEGORIES[1],
          sentences: [{ sequence: 1, content: '가나다' }],
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /^멋쟁이사자처럼/ }))
    const startButton = screen.getByRole('button', { name: '방송 참여하기' })

    // 리렌더를 기다리지 않고 연속으로 눌러본다
    fireEvent.click(startButton)
    fireEvent.click(startButton)
    fireEvent.click(startButton)

    await screen.findByText('게임 화면')
    expect(startGameCallCount).toBe(1)
  })

  it('이용권이 없으면(NO_AVAILABLE_PASS) 운영진 문의 화면으로 전환된다', async () => {
    server.use(
      http.post('*/game-sessions', () =>
        HttpResponse.json(
          { code: 'NO_AVAILABLE_PASS', message: '사용 가능한 이용권이 없습니다.' },
          { status: 409 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /성결대 멋사/ }))
    await user.click(screen.getByRole('button', { name: '방송 참여하기' }))

    await waitFor(() =>
      expect(
        screen.getByText('재도전은 운영진에게 문의해주세요. 결제 확인 후 다시 참가할 수 있습니다.'),
      ).toBeInTheDocument(),
    )
    // 게임 화면으로는 넘어가지 않아야 한다
    expect(screen.queryByText('게임 화면')).not.toBeInTheDocument()
  })
})

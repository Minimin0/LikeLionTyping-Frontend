/**
 * 게임 화면 통합 테스트.
 * 개별 함수가 아니라 "실제로 쳐서 넘어가는지"를 검증한다.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'

import type { GameSessionResponse } from '../types/game.types'
import { GamePage } from './GamePage'

const SESSION: GameSessionResponse = {
  gameSessionId: 21,
  category: { id: 2, code: 'CH02', name: 'CH.02 캠퍼스 주파수' },
  sentences: [
    { sequence: 1, content: '가나다' },
    { sequence: 2, content: '라마바' },
  ],
}

let completeCallCount = 0
let lastElapsedMs: number | null = null
let lastRequestKeys: string[] = []

const server = setupServer(
  http.post('*/game-sessions/:gameSessionId/complete', async ({ request }) => {
    completeCallCount += 1
    const body = (await request.json()) as { elapsedMs: number }
    lastRequestKeys = Object.keys(body)
    const { elapsedMs } = body
    lastElapsedMs = elapsedMs
    return HttpResponse.json({
      elapsedMs,
      personalBestMs: elapsedMs,
      personalBest: true,
      rank: 3,
    })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  completeCallCount = 0
  lastElapsedMs = null
  lastRequestKeys = []
})

function renderGamePage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[{ pathname: '/game/play', state: { session: SESSION } }]}>
        <Routes>
          <Route path="/game/play" element={<GamePage />} />
          <Route path="/game/category" element={<p>채널 선택 화면</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

/** 시작 버튼을 누르고 카운트다운이 끝나 첫 문장이 나올 때까지 기다린다 */
async function startGame(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '게임 시작' }))

  const input = await screen.findByRole('textbox', { name: '타이핑 입력창' }, { timeout: 6000 })
  await waitFor(() => expect(input).not.toBeDisabled(), { timeout: 6000 })
  return input
}

describe('GamePage — 게임 진행', () => {
  it('오타가 남아있으면 Enter를 눌러도 다음 문장으로 넘어가지 않는다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    // 진행 표시는 1 / 2에서 시작한다
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')

    // 오타를 낸 상태로 Enter
    await user.type(input, '가라다')
    expect(screen.getByText('오타를 수정해야 다음으로 넘어갈 수 있어요')).toBeInTheDocument()

    await user.type(input, '{Enter}')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    expect(input).toHaveValue('가라다')

    // 백스페이스로 수정한 뒤에는 정상적으로 넘어간다
    await user.type(input, '{Backspace}{Backspace}나다{Enter}')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
    expect(input).toHaveValue('')
  }, 20000)

  it('마지막 문장을 끝내면 완료 요청이 한 번만 나가고 결과가 표시된다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    await user.type(input, '가나다{Enter}')
    await user.type(input, '라마바')

    // Enter 연타 — SUBMITTING 진입 후에는 입력이 막혀 요청이 중복되지 않아야 한다
    await user.type(input, '{Enter}{Enter}{Enter}')

    await screen.findByText('방송 완료', undefined, { timeout: 6000 })
    expect(completeCallCount).toBe(1)
    // 프론트가 계산해 보내는 값은 정수 millisecond 하나뿐이다
    expect(Number.isInteger(lastElapsedMs)).toBe(true)

    // PB / 순위는 서버 응답을 그대로 보여준다
    expect(screen.getByText('3위')).toBeInTheDocument()
    expect(screen.getByText('개인 최고 기록 경신')).toBeInTheDocument()
  }, 20000)

  it('완료 요청 body에는 elapsedMs 외의 필드가 들어가지 않는다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    await user.type(input, '가나다{Enter}')
    await user.type(input, '라마바{Enter}')
    await screen.findByText('방송 완료', undefined, { timeout: 6000 })

    // 타수(cpm)는 화면 표시 전용이라 명세에 없는 필드로 새어 나가면 안 된다
    expect(lastRequestKeys).toEqual(['elapsedMs'])
  }, 20000)
})

describe('GamePage — 타수 표시', () => {
  it('게임 중 스톱워치 옆에 현재 타수가 보인다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    expect(screen.getByText('경과 시간')).toBeInTheDocument()
    expect(screen.getByText('현재 타수')).toBeInTheDocument()

    // 시작 직후에는 경과 시간이 짧아 0으로 표시된다 (Infinity/NaN 방지)
    expect(screen.getByText('타').previousSibling?.textContent).not.toMatch(/Infinity|NaN/)

    await user.type(input, '가나다')
    expect(screen.getByText('현재 타수')).toBeInTheDocument()
  }, 20000)

  it('결과 화면에 최종 평균 타수가 표시된다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    await user.type(input, '가나다{Enter}')
    await user.type(input, '라마바{Enter}')
    await screen.findByText('방송 완료', undefined, { timeout: 6000 })

    expect(screen.getByText(/평균 \d+ 타\/분/)).toBeInTheDocument()
    // 타이머가 멈췄으므로 "현재 타수"는 더 이상 보이지 않는다
    expect(screen.queryByText('현재 타수')).not.toBeInTheDocument()
  }, 20000)
})

describe('GamePage — 표시', () => {
  it('화면에 보이는 입력 칸이 따로 없고, 문장 영역 하나에 입력이 반영된다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    // 실제 input은 IME를 받기 위해 남아있지만 시각적으로는 감춰져 있다
    expect(input).toHaveClass('opacity-0')
    expect(input).toHaveClass('outline-none')
    expect(input).toHaveClass('caret-transparent')

    // 문장 영역은 "입력한 글자 + 아직 안 친 목표 문장"으로 그려진다
    await user.type(input, '가라')
    expect(screen.getByLabelText('가나다')).toHaveTextContent('가라다')
  }, 20000)

  it('항목 개수는 하드코딩이 아니라 서버가 내려준 배열 길이를 따른다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    await startGame(user)

    // 이 세션의 sentences는 2개이므로 5가 아니라 2가 나와야 한다
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuemax', '2')
    expect(progress.parentElement).toHaveTextContent('1 / 2')
  }, 20000)
})

describe('GamePage — 한글 IME', () => {
  it('조합 중 Enter는 무시되고, 조합이 끝난 뒤 Enter라야 넘어간다', async () => {
    const user = userEvent.setup()
    renderGamePage()
    const input = await startGame(user)

    // "가나다"를 치는 중 마지막 글자가 아직 조합 중인 상태
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '가나ㄷ' } })

    // 조합 중인 글자는 오타로 판정하지 않는다
    expect(screen.queryByText('오타를 수정해야 다음으로 넘어갈 수 있어요')).not.toBeInTheDocument()

    // 조합이 확정되기 전 문장이 완성돼도 Enter는 제출로 인정되지 않는다
    fireEvent.change(input, { target: { value: '가나다' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')

    // 조합이 끝난 뒤의 Enter만 다음 문장으로 넘긴다
    fireEvent.compositionEnd(input, { target: { value: '가나다' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2'),
    )
  }, 20000)
})

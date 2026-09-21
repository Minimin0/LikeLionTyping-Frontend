import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../shared/api/client'
import { AudioProvider } from '../../shared/audio/AudioProvider'
import { ResultPage } from './ResultPage'

const audioInstances: FakeAudio[] = []

class FakeAudio {
  currentTime = 0
  loop = false
  preload = ''
  volume = 1
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()

  constructor(public src: string) {
    audioInstances.push(this)
  }
}

afterEach(() => {
  cleanup()
  audioInstances.length = 0
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ResultPage', () => {
  it('직접 진입해 location.state가 없어도 서버에서 결과를 조회한다', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        gameSessionId: 4,
        status: 'COMPLETED',
        elapsedMs: 42000,
        personalBestMs: 42000,
        personalBest: true,
        rank: 2,
      },
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/result/4']}>
          <Routes>
            <Route path="/result/:gameSessionId" element={<ResultPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('방송 완료')).toBeInTheDocument()
    expect(screen.getAllByText('42.000초')).toHaveLength(2)
  })

  it('plays game complete audio exactly once for a completed result', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    renderResult({
      gameSessionId: 4,
      status: 'COMPLETED',
      elapsedMs: 42000,
      personalBestMs: 42000,
      personalBest: true,
      rank: 2,
    })

    await waitFor(() => expect(instance('game_complete')?.play).toHaveBeenCalledTimes(1))
    await userEvent.click(screen.getByRole('button', { name: 'rerender' }))

    expect(instance('game_complete')?.play).toHaveBeenCalledTimes(1)
  })

  it('does not play game complete audio for unfinished results', () => {
    vi.stubGlobal('Audio', FakeAudio)
    renderResult({
      gameSessionId: 4,
      status: 'IN_PROGRESS',
      elapsedMs: null,
      personalBestMs: null,
      personalBest: false,
      rank: null,
    })

    expect(instance('game_complete')).toBeUndefined()
  })
})

function renderResult(state: unknown) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/result/4', state }]}>
        <AudioProvider>
          <ResultHarness />
        </AudioProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function ResultHarness() {
  const [count, setCount] = useState(0)
  return (
    <>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        rerender
      </button>
      <span>{count}</span>
      <Routes>
        <Route path="/result/:gameSessionId" element={<ResultPage />} />
      </Routes>
    </>
  )
}

function instance(srcPart: string) {
  return audioInstances.find((audio) => audio.src.includes(srcPart))
}

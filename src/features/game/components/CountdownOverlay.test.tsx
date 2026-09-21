import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioProvider } from '../../../shared/audio/AudioProvider'
import { CountdownOverlay } from './CountdownOverlay'

const instances: FakeAudio[] = []

class FakeAudio {
  currentTime = 0
  loop = false
  preload = ''
  volume = 1
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()

  constructor(public src: string) {
    instances.push(this)
  }
}

afterEach(() => {
  cleanup()
  instances.length = 0
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('CountdownOverlay audio', () => {
  it('plays tick for 3/2/1 and GO without delaying onComplete', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('Audio', FakeAudio)
    const onComplete = vi.fn()

    render(
      <MemoryRouter>
        <AudioProvider>
          <CountdownOverlay onComplete={onComplete} />
        </AudioProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(played('countdown_tick')).toHaveLength(1)

    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(played('countdown_tick')).toHaveLength(1)
    expect(instance('countdown_tick')?.play).toHaveBeenCalledTimes(2)

    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(instance('countdown_tick')?.play).toHaveBeenCalledTimes(3)

    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(screen.getByText('GO')).toBeInTheDocument()
    expect(played('countdown_go')).toHaveLength(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

function played(srcPart: string) {
  return instances.filter((audio) => audio.src.includes(srcPart) && audio.play.mock.calls.length)
}

function instance(srcPart: string) {
  return instances.find((audio) => audio.src.includes(srcPart))
}

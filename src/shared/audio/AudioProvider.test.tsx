import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AudioProvider,
  channelTrackFromCode,
  useAppAudio,
  type BgmTrack,
} from './AudioProvider'

const instances: FakeAudio[] = []

class FakeAudio {
  currentTime = 0
  loop = false
  preload = ''
  volume = 1
  paused = true
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn(() => {
    this.paused = true
  })

  constructor(public src: string) {
    instances.push(this)
  }
}

function Controls() {
  const { bgmEnabled, setBgmTrack, toggleBgm } = useAppAudio()
  const play = (track: BgmTrack) => () => setBgmTrack(track)

  return (
    <>
      <span>{bgmEnabled ? 'on' : 'off'}</span>
      <button type="button" onClick={toggleBgm}>toggle</button>
      <button type="button" onClick={play('default')}>default</button>
      <button type="button" onClick={play('channel-1')}>ch1</button>
      <button type="button" onClick={play('channel-2')}>ch2</button>
      <button type="button" onClick={play('channel-3')}>ch3</button>
      <Link to="/participate">participate</Link>
      <Link to="/rankings">rankings</Link>
      <Link to="/admin">admin</Link>
    </>
  )
}

function renderAudio(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AudioProvider>
        <Routes>
          <Route path="*" element={<Controls />} />
        </Routes>
      </AudioProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  instances.length = 0
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('AudioProvider BGM', () => {
  it('plays default BGM on landing and keeps it through participate without restart', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    renderAudio('/')

    await waitFor(() => expect(played('bgm_default')).toHaveLength(1))
    await userEvent.click(screen.getByRole('link', { name: 'participate' }))

    expect(played('bgm_default')).toHaveLength(1)
  })

  it('does not restart the same track request', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    renderAudio('/admin')

    await userEvent.click(screen.getByRole('button', { name: 'default' }))
    await userEvent.click(screen.getByRole('button', { name: 'default' }))

    expect(played('bgm_default')).toHaveLength(1)
  })

  it('switches categories by channel code mapping', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    renderAudio('/categories')

    await userEvent.click(screen.getByRole('button', { name: 'ch1' }))
    await userEvent.click(screen.getByRole('button', { name: 'ch2' }))
    await userEvent.click(screen.getByRole('button', { name: 'ch3' }))

    expect(channelTrackFromCode('CH01')).toBe('channel-1')
    expect(channelTrackFromCode('CH02')).toBe('channel-2')
    expect(channelTrackFromCode('CH03')).toBe('channel-3')
    expect(played('bgm_channel_1')).toHaveLength(1)
    expect(played('bgm_channel_2')).toHaveLength(1)
    expect(played('bgm_channel_3')).toHaveLength(1)
  })

  it('uses ranking BGM and stops on admin routes', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    renderAudio('/rankings')

    await waitFor(() => expect(played('bgm_ranking')).toHaveLength(1))
    await userEvent.click(screen.getByRole('link', { name: 'admin' }))

    expect(instance('bgm_ranking')?.pause).toHaveBeenCalled()
  })

  it('respects BGM disabled and persists the toggle', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    sessionStorage.setItem('likelion-bgm-enabled', 'false')
    renderAudio('/')

    expect(screen.getByText('off')).toBeInTheDocument()
    expect(played('bgm_default')).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

    expect(sessionStorage.getItem('likelion-bgm-enabled')).toBe('true')
    await waitFor(() => expect(played('bgm_default')).toHaveLength(1))
  })

  it('survives autoplay rejection and retries on first user gesture', async () => {
    class RejectOnceAudio extends FakeAudio {
      play = vi
        .fn()
        .mockRejectedValueOnce(new Error('blocked'))
        .mockResolvedValue(undefined)
    }
    vi.stubGlobal('Audio', RejectOnceAudio)
    renderAudio('/')

    await waitFor(() => expect(instance('bgm_default')?.play).toHaveBeenCalledTimes(1))
    window.dispatchEvent(new Event('pointerdown'))

    await waitFor(() => expect(instance('bgm_default')?.play).toHaveBeenCalledTimes(2))
  })
})

function played(srcPart: string) {
  return instances.filter((audio) => audio.src.includes(srcPart) && audio.play.mock.calls.length)
}

function instance(srcPart: string) {
  return instances.find((audio) => audio.src.includes(srcPart))
}

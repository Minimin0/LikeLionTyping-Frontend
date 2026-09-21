import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAudioPool,
  getTypingSoundKind,
  useTypingSound,
} from './useTypingSound'

function keyboardEvent(
  code: string,
  options: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey'>> = {},
) {
  return {
    code,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...options,
  } as KeyboardEvent
}

function Harness() {
  const { soundEnabled, toggleSound, playTypingSound } = useTypingSound()

  return (
    <>
      <span>{soundEnabled ? 'on' : 'off'}</span>
      <button type="button" onClick={toggleSound}>
        toggle
      </button>
      <button
        type="button"
        onClick={() => playTypingSound(keyboardEvent('KeyA'))}
      >
        play key
      </button>
    </>
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useTypingSound settings', () => {
  it('enables sound by default', async () => {
    render(<Harness />)

    expect(screen.getByText('on')).toBeInTheDocument()
    await waitFor(() =>
      expect(sessionStorage.getItem('likelion-typing-sound-enabled')).toBe('true'),
    )
  })

  it('keeps sessionStorage false disabled', () => {
    sessionStorage.setItem('likelion-typing-sound-enabled', 'false')

    render(<Harness />)

    expect(screen.getByText('off')).toBeInTheDocument()
    expect(sessionStorage.getItem('likelion-typing-sound-enabled')).toBe('false')
  })

  it('toggle off writes false', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

    expect(screen.getByText('off')).toBeInTheDocument()
    expect(sessionStorage.getItem('likelion-typing-sound-enabled')).toBe('false')
  })

  it('toggle on writes true', async () => {
    sessionStorage.setItem('likelion-typing-sound-enabled', 'false')
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

    expect(screen.getByText('on')).toBeInTheDocument()
    expect(sessionStorage.getItem('likelion-typing-sound-enabled')).toBe('true')
  })
})

describe('getTypingSoundKind', () => {
  it('maps KeyA to key sound', () => {
    expect(getTypingSoundKind(keyboardEvent('KeyA'))).toBe('key')
  })

  it('maps Digit1 to key sound', () => {
    expect(getTypingSoundKind(keyboardEvent('Digit1'))).toBe('key')
  })

  it('maps Backspace to key sound', () => {
    expect(getTypingSoundKind(keyboardEvent('Backspace'))).toBe('key')
  })

  it('maps Space only to space sound', () => {
    expect(getTypingSoundKind(keyboardEvent('Space'))).toBe('space')
  })

  it('maps Enter only to enter sound', () => {
    expect(getTypingSoundKind(keyboardEvent('Enter'))).toBe('enter')
  })

  it('mutes Shift', () => {
    expect(getTypingSoundKind(keyboardEvent('ShiftLeft'))).toBeNull()
  })

  it('keeps Shift+Key as key sound', () => {
    expect(
      getTypingSoundKind({ ...keyboardEvent('KeyA'), shiftKey: true } as KeyboardEvent),
    ).toBe('key')
  })

  it('mutes Control', () => {
    expect(getTypingSoundKind(keyboardEvent('ControlLeft'))).toBeNull()
  })

  it('mutes Meta', () => {
    expect(getTypingSoundKind(keyboardEvent('MetaLeft'))).toBeNull()
  })

  it('mutes Alt', () => {
    expect(getTypingSoundKind(keyboardEvent('AltLeft'))).toBeNull()
  })

  it('mutes Ctrl+Key shortcuts', () => {
    expect(getTypingSoundKind(keyboardEvent('KeyA', { ctrlKey: true }))).toBeNull()
  })
})

describe('audio pool', () => {
  it('does not play when sound is off', async () => {
    const instances: { play: ReturnType<typeof vi.fn> }[] = []
    class FakeAudio {
      currentTime = 0
      preload = ''
      volume = 1
      play = vi.fn(() => Promise.resolve())

      constructor() {
        instances.push(this)
      }
    }
    vi.stubGlobal('Audio', FakeAudio)
    sessionStorage.setItem('likelion-typing-sound-enabled', 'false')
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'play key' }))

    expect(instances).toHaveLength(0)
  })

  it('swallows play rejection', async () => {
    const audio = {
      currentTime: 3,
      preload: '',
      volume: 1,
      play: vi.fn(() => Promise.reject(new Error('blocked'))),
    }
    const pool = createAudioPool('key.wav', 1, 0.22, () => audio)

    expect(() => pool.play()).not.toThrow()
    await Promise.resolve()
  })

  it('reuses pooled audio in round-robin order', () => {
    const audios = Array.from({ length: 2 }, () => ({
      currentTime: 9,
      preload: '',
      volume: 1,
      play: vi.fn(() => Promise.resolve()),
    }))
    let nextAudio = 0
    const pool = createAudioPool('key.wav', 2, 0.22, () => audios[nextAudio++]!)

    pool.play()
    pool.play()
    pool.play()

    expect(audios[0].play).toHaveBeenCalledTimes(2)
    expect(audios[1].play).toHaveBeenCalledTimes(1)
    expect(audios[0].currentTime).toBe(0)
    expect(audios[0].preload).toBe('auto')
    expect(audios[0].volume).toBe(0.22)
  })
})

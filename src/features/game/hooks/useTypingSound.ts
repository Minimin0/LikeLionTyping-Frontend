import { useCallback, useEffect, useRef, useState } from 'react'
import enterSoundUrl from '../assets/sounds/typing_enter.mp3'
import keySoundUrl from '../assets/sounds/typing_key.wav'
import spaceSoundUrl from '../assets/sounds/typing_space.mp3'

const STORAGE_KEY = 'likelion-typing-sound-enabled'

type SoundKind = 'key' | 'space' | 'enter'
type AudioLike = {
  currentTime: number
  preload: string
  volume: number
  play: () => Promise<unknown>
}
type AudioFactory = (src: string) => AudioLike

const keyCodes = new Set([
  'Backquote',
  'Minus',
  'Equal',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'Semicolon',
  'Quote',
  'Comma',
  'Period',
  'Slash',
  'Backspace',
])

const mutedCodes = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
  'Tab',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])

export function getTypingSoundKind(
  event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey'>,
): SoundKind | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (event.code === 'Space') return 'space'
  if (event.code === 'Enter') return 'enter'
  if (mutedCodes.has(event.code) || /^F([1-9]|1[0-2])$/.test(event.code)) return null
  if (/^Key[A-Z]$/.test(event.code) || /^Digit[0-9]$/.test(event.code)) return 'key'
  return keyCodes.has(event.code) ? 'key' : null
}

export function createAudioPool(
  src: string,
  size: number,
  volume: number,
  audioFactory: AudioFactory = (url) => new Audio(url),
) {
  const audios = Array.from({ length: size }, () => {
    const audio = audioFactory(src)
    audio.preload = 'auto'
    audio.volume = volume
    return audio
  })
  let index = 0

  return {
    play() {
      const audio = audios[index]
      index = (index + 1) % audios.length
      audio.currentTime = 0
      void Promise.resolve(audio.play()).catch(() => {})
    },
  }
}

function createPools() {
  return {
    key: createAudioPool(keySoundUrl, 8, 0.22),
    space: createAudioPool(spaceSoundUrl, 4, 0.22),
    enter: createAudioPool(enterSoundUrl, 3, 0.2),
  }
}

export function useTypingSound() {
  const [soundEnabled, setSoundEnabled] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) !== 'false',
  )
  const pools = useRef<ReturnType<typeof createPools> | null>(null)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(soundEnabled))
  }, [soundEnabled])

  const toggleSound = useCallback(() => {
    setSoundEnabled((enabled) => {
      const next = !enabled
      sessionStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const playTypingSound = useCallback(
    (event: KeyboardEvent) => {
      if (!soundEnabled) return
      const kind = getTypingSoundKind(event)
      if (!kind) return
      pools.current ??= createPools()
      pools.current[kind].play()
    },
    [soundEnabled],
  )

  return { soundEnabled, toggleSound, playTypingSound }
}

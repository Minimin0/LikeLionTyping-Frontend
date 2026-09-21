import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import bgmChannel1 from './assets/bgm_channel_1.mp3'
import bgmChannel2 from './assets/bgm_channel_2.mp3'
import bgmChannel3 from './assets/bgm_channel_3.mp3'
import bgmDefault from './assets/bgm_default.mp3'
import bgmRanking from './assets/bgm_ranking.mp3'
import countdownGo from './assets/countdown_go.mp3'
import countdownTick from './assets/countdown_tick.mp3'
import gameComplete from './assets/game_complete.mp3'

const BGM_STORAGE_KEY = 'likelion-bgm-enabled'
const NORMAL_BGM_VOLUME = 0.16
const DUCKED_BGM_VOLUME = 0.06

export type BgmTrack = 'default' | 'channel-1' | 'channel-2' | 'channel-3' | 'ranking'

type AudioContextValue = {
  bgmEnabled: boolean
  toggleBgm: () => void
  setBgmTrack: (track: BgmTrack | null) => void
  setBgmDucked: (ducked: boolean) => void
  playCountdownTick: () => void
  playCountdownGo: () => void
  playGameComplete: (id: number | string) => void
}

type AudioLike = HTMLAudioElement

const AudioContext = createContext<AudioContextValue | null>(null)
const noopAudio: AudioContextValue = {
  bgmEnabled: true,
  toggleBgm: () => {},
  setBgmTrack: () => {},
  setBgmDucked: () => {},
  playCountdownTick: () => {},
  playCountdownGo: () => {},
  playGameComplete: () => {},
}

const bgmSources: Record<BgmTrack, string> = {
  default: bgmDefault,
  'channel-1': bgmChannel1,
  'channel-2': bgmChannel2,
  'channel-3': bgmChannel3,
  ranking: bgmRanking,
}

export function channelTrackFromCode(code: string | undefined): BgmTrack | null {
  if (/^CH\.?01$/i.test(code ?? '')) return 'channel-1'
  if (/^CH\.?02$/i.test(code ?? '')) return 'channel-2'
  if (/^CH\.?03$/i.test(code ?? '')) return 'channel-3'
  return null
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [bgmEnabled, setBgmEnabled] = useState(
    () => sessionStorage.getItem(BGM_STORAGE_KEY) !== 'false',
  )
  const activeTrack = useRef<BgmTrack | null>(null)
  const requestedTrack = useRef<BgmTrack | null>(null)
  const bgm = useRef<Partial<Record<BgmTrack, AudioLike>>>({})
  const ducked = useRef(false)
  const userInteracted = useRef(false)
  const completedResults = useRef(new Set<string>())
  const eventAudio = useRef<Record<'tick' | 'go' | 'complete', AudioLike> | null>(null)

  const getBgm = useCallback((track: BgmTrack) => {
    bgm.current[track] ??= createAudio(bgmSources[track], {
      loop: true,
      volume: ducked.current ? DUCKED_BGM_VOLUME : NORMAL_BGM_VOLUME,
    })
    return bgm.current[track]!
  }, [])

  const getEventAudio = useCallback(() => {
    eventAudio.current ??= {
      tick: createAudio(countdownTick, { volume: 0.55 }),
      go: createAudio(countdownGo, { volume: 0.55 }),
      complete: createAudio(gameComplete, { volume: 0.5 }),
    }
    return eventAudio.current
  }, [])

  const stopBgm = useCallback(() => {
    Object.values(bgm.current).forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    activeTrack.current = null
  }, [])

  const playRequested = useCallback(() => {
    if (!bgmEnabled || !requestedTrack.current) {
      stopBgm()
      return
    }

    const track = requestedTrack.current
    if (activeTrack.current === track) return
    stopBgm()
    const audio = getBgm(track)
    activeTrack.current = track
    safePlay(audio)
  }, [bgmEnabled, getBgm, stopBgm])

  const setBgmTrack = useCallback(
    (track: BgmTrack | null) => {
      stopCompleteAudio(eventAudio.current?.complete)
      requestedTrack.current = track
      playRequested()
    },
    [playRequested],
  )

  const setBgmDucked = useCallback((nextDucked: boolean) => {
    ducked.current = nextDucked
    Object.values(bgm.current).forEach((audio) => {
      audio.volume = nextDucked ? DUCKED_BGM_VOLUME : NORMAL_BGM_VOLUME
    })
  }, [])

  useEffect(() => {
    sessionStorage.setItem(BGM_STORAGE_KEY, String(bgmEnabled))
    playRequested()
  }, [bgmEnabled, playRequested])

  useEffect(() => {
    if (pathname === '/' || pathname === '/participate') setBgmTrack('default')
    else if (pathname === '/rankings') setBgmTrack('ranking')
    else if (pathname.startsWith('/admin') || pathname.startsWith('/result')) setBgmTrack(null)
  }, [pathname, setBgmTrack])

  useEffect(() => {
    const retry = () => {
      userInteracted.current = true
      if (bgmEnabled && requestedTrack.current && activeTrack.current === requestedTrack.current) {
        safePlay(getBgm(requestedTrack.current))
        return
      }
      playRequested()
    }
    window.addEventListener('pointerdown', retry)
    window.addEventListener('keydown', retry)
    window.addEventListener('touchstart', retry)
    return () => {
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
      window.removeEventListener('touchstart', retry)
    }
  }, [bgmEnabled, getBgm, playRequested])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        Object.values(bgm.current).forEach((audio) => audio.pause())
      } else if (userInteracted.current) {
        playRequested()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [playRequested])

  const value = useMemo<AudioContextValue>(
    () => ({
      bgmEnabled,
      toggleBgm: () => setBgmEnabled((enabled) => !enabled),
      setBgmTrack,
      setBgmDucked,
      playCountdownTick: () => playOneShot(getEventAudio().tick),
      playCountdownGo: () => playOneShot(getEventAudio().go),
      playGameComplete: (id) => {
        const key = String(id)
        if (completedResults.current.has(key)) return
        completedResults.current.add(key)
        stopBgm()
        playOneShot(getEventAudio().complete)
      },
    }),
    [bgmEnabled, getEventAudio, setBgmDucked, setBgmTrack, stopBgm],
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAppAudio() {
  const value = useContext(AudioContext)
  return value ?? noopAudio
}

function createAudio(src: string, options: { loop?: boolean; volume: number }) {
  const audio = new Audio(src)
  audio.preload = 'auto'
  audio.loop = Boolean(options.loop)
  audio.volume = options.volume
  return audio
}

function playOneShot(audio: AudioLike) {
  audio.pause()
  audio.currentTime = 0
  safePlay(audio)
}

function safePlay(audio: AudioLike) {
  void Promise.resolve(audio.play()).catch(() => {})
}

function stopCompleteAudio(audio: AudioLike | undefined) {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

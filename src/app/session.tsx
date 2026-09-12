import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { GameStart, Participant } from '../shared/api/types'

export type ActiveGame = GameStart & {
  currentIndex: number
  startedAtMs: number | null
}

type SessionContextValue = {
  participant: Participant | null
  activeGame: ActiveGame | null
  setParticipant: (participant: Participant | null) => void
  setActiveGame: (game: ActiveGame | null) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const read = <T,>(key: string): T | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T | null
  } catch {
    sessionStorage.removeItem(key)
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [participantState, setParticipantState] = useState<Participant | null>(
    () => read('participant'),
  )
  const [activeGameState, setActiveGameState] = useState<ActiveGame | null>(
    () => read('activeGame'),
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      participant: participantState,
      activeGame: activeGameState,
      setParticipant: (participant) => {
        setParticipantState(participant)
        if (participant)
          sessionStorage.setItem('participant', JSON.stringify(participant))
        else sessionStorage.removeItem('participant')
      },
      setActiveGame: (game) => {
        setActiveGameState(game)
        if (game) sessionStorage.setItem('activeGame', JSON.stringify(game))
        else sessionStorage.removeItem('activeGame')
      },
    }),
    [activeGameState, participantState],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export const useSession = () => {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}

export type GamePhase =
  'READY' | 'COUNTDOWN' | 'PLAYING' | 'SUBMITTING' | 'RESULT'

export type GameState = { phase: GamePhase; error: string | null }
export type GameAction =
  | { type: 'COUNTDOWN' }
  | { type: 'PLAY' }
  | { type: 'SUBMIT' }
  | { type: 'FAIL'; error: string }
  | { type: 'RESULT' }

export const gameReducer = (
  state: GameState,
  action: GameAction,
): GameState => {
  if (action.type === 'COUNTDOWN' && state.phase === 'READY')
    return { phase: 'COUNTDOWN', error: null }
  if (
    action.type === 'PLAY' &&
    ['COUNTDOWN', 'SUBMITTING'].includes(state.phase)
  )
    return { phase: 'PLAYING', error: null }
  if (action.type === 'SUBMIT' && state.phase === 'PLAYING')
    return { phase: 'SUBMITTING', error: null }
  if (action.type === 'FAIL') return { ...state, error: action.error }
  if (action.type === 'RESULT' && state.phase === 'SUBMITTING')
    return { phase: 'RESULT', error: null }
  return state
}

export const canAdvanceSentence = (
  key: string,
  isComposing: boolean,
  input: string,
  sentence: string,
) => key === 'Enter' && !isComposing && input === sentence

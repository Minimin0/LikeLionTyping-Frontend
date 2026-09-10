import { describe, expect, it } from 'vitest'
import { canAdvanceSentence, gameReducer, type GameState } from './gameMachine'

describe('game state machine', () => {
  it('allows only the fixed state sequence and ignores duplicate submit', () => {
    let state: GameState = { phase: 'READY', error: null }
    state = gameReducer(state, { type: 'COUNTDOWN' })
    state = gameReducer(state, { type: 'PLAY' })
    state = gameReducer(state, { type: 'SUBMIT' })
    expect(gameReducer(state, { type: 'SUBMIT' })).toEqual(state)
    expect(state.phase).toBe('SUBMITTING')
  })

  it('blocks Enter while composing or when the sentence differs', () => {
    expect(canAdvanceSentence('Enter', true, '멋쟁이', '멋쟁이')).toBe(false)
    expect(canAdvanceSentence('Enter', false, '멋쟁', '멋쟁이')).toBe(false)
    expect(canAdvanceSentence('Enter', false, '멋쟁이', '멋쟁이')).toBe(true)
  })
})

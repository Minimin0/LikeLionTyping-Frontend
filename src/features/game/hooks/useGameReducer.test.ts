import { describe, expect, it } from 'vitest'

import type { SentenceDto } from '../types/game.types'
import { gameReducer, initialGameState, type GameState } from './useGameReducer'

const SENTENCES: SentenceDto[] = [
  { sequence: 1, content: '가나다' },
  { sequence: 2, content: '라마바' },
]

/** PLAYING 상태의 게임을 만들어준다 */
function playing(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialGameState,
    status: 'PLAYING',
    sessionId: 21,
    sentences: SENTENCES,
    ...overrides,
  }
}

describe('gameReducer — 상태 전이', () => {
  it('INIT_SESSION은 문장을 주입하고 READY로 만든다', () => {
    const next = gameReducer(initialGameState, {
      type: 'INIT_SESSION',
      sessionId: 21,
      sentences: SENTENCES,
    })
    expect(next).toMatchObject({ status: 'READY', sessionId: 21, currentIndex: 0 })
  })

  it('READY → COUNTDOWN → PLAYING 순서로만 진행된다', () => {
    const ready = gameReducer(initialGameState, {
      type: 'INIT_SESSION',
      sessionId: 21,
      sentences: SENTENCES,
    })
    const countdown = gameReducer(ready, { type: 'START_COUNTDOWN' })
    expect(countdown.status).toBe('COUNTDOWN')
    expect(gameReducer(countdown, { type: 'START_PLAYING' }).status).toBe('PLAYING')
  })

  it('시작 버튼을 연타해도 카운트다운이 재시작되지 않는다', () => {
    const countdown = gameReducer(
      { ...initialGameState, status: 'COUNTDOWN' },
      { type: 'START_COUNTDOWN' },
    )
    expect(countdown.status).toBe('COUNTDOWN')
  })
})

describe('gameReducer — 오타가 있으면 다음 문장으로 넘어가지 않는다', () => {
  it('오타 상태에서 NEXT_SENTENCE는 무시된다', () => {
    const state = playing({ input: '가라다' })
    const next = gameReducer(state, { type: 'NEXT_SENTENCE' })

    expect(next.currentIndex).toBe(0)
    expect(next.input).toBe('가라다')
  })

  it('아직 다 치지 않았으면 NEXT_SENTENCE는 무시된다', () => {
    const next = gameReducer(playing({ input: '가나' }), { type: 'NEXT_SENTENCE' })
    expect(next.currentIndex).toBe(0)
  })

  it('한글 조합 중이면 문장이 일치해도 넘어가지 않는다', () => {
    const next = gameReducer(playing({ input: '가나다', isComposing: true }), {
      type: 'NEXT_SENTENCE',
    })
    expect(next.currentIndex).toBe(0)
  })

  it('정확히 입력하고 조합이 끝났으면 다음 문장으로 넘어가고 입력이 초기화된다', () => {
    const next = gameReducer(playing({ input: '가나다' }), { type: 'NEXT_SENTENCE' })

    expect(next.currentIndex).toBe(1)
    expect(next.input).toBe('')
    expect(next.isComposing).toBe(false)
  })

  it('마지막 문장에서는 NEXT_SENTENCE가 인덱스를 넘기지 않는다 (FINISH가 처리)', () => {
    const state = playing({ currentIndex: 1, input: '라마바' })
    expect(gameReducer(state, { type: 'NEXT_SENTENCE' }).currentIndex).toBe(1)
  })
})

describe('gameReducer — 완료와 중복 제출 방어', () => {
  it('마지막 문장을 정확히 입력하면 SUBMITTING으로 가고 기록이 확정된다', () => {
    const next = gameReducer(playing({ currentIndex: 1, input: '라마바' }), {
      type: 'FINISH',
      elapsedMs: 43821,
    })

    expect(next.status).toBe('SUBMITTING')
    expect(next.elapsedMs).toBe(43821)
  })

  it('마지막 문장에 오타가 있으면 FINISH가 무시된다', () => {
    const next = gameReducer(playing({ currentIndex: 1, input: '라마사' }), {
      type: 'FINISH',
      elapsedMs: 43821,
    })
    expect(next.status).toBe('PLAYING')
    expect(next.elapsedMs).toBeNull()
  })

  it('마지막 문장이 아니면 FINISH가 무시된다', () => {
    const next = gameReducer(playing({ input: '가나다' }), { type: 'FINISH', elapsedMs: 100 })
    expect(next.status).toBe('PLAYING')
  })

  it('SUBMITTING 상태에서는 Enter 연타(FINISH)가 기록을 덮어쓰지 못한다', () => {
    const submitting = gameReducer(playing({ currentIndex: 1, input: '라마바' }), {
      type: 'FINISH',
      elapsedMs: 43821,
    })
    const again = gameReducer(submitting, { type: 'FINISH', elapsedMs: 99999 })

    expect(again.elapsedMs).toBe(43821)
    expect(again).toBe(submitting)
  })

  it('SUBMITTING 상태에서는 입력을 받지 않는다', () => {
    const submitting = gameReducer(playing({ currentIndex: 1, input: '라마바' }), {
      type: 'FINISH',
      elapsedMs: 43821,
    })
    expect(gameReducer(submitting, { type: 'TYPE_INPUT', value: '깨짐' }).input).toBe('라마바')
  })

  it('완료 API 실패 시 RESULT로 가되 결과 없이 에러 코드를 남긴다', () => {
    const submitting = gameReducer(playing({ currentIndex: 1, input: '라마바' }), {
      type: 'FINISH',
      elapsedMs: 43821,
    })
    const failed = gameReducer(submitting, { type: 'SUBMIT_FAIL', code: 'INVALID_GAME_STATE' })

    expect(failed.status).toBe('RESULT')
    expect(failed.result).toBeNull()
    expect(failed.errorCode).toBe('INVALID_GAME_STATE')
  })
})

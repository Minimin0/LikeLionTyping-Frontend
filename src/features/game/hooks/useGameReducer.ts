/**
 * 게임 State Machine.
 *
 *   READY → COUNTDOWN → PLAYING → SUBMITTING → RESULT
 *
 * 게임 진행 상태는 전부 이 reducer 하나가 소유한다.
 * 화면 쪽에서 "오타가 있는데 넘어갔다" 같은 사고가 나지 않도록,
 * 진행 가능 여부 판정을 컴포넌트가 아니라 reducer 안에서 한 번 더 검사한다.
 */
import { useReducer } from 'react'

import type { ApiErrorCode } from '@/shared/api/apiError'

import type { CompleteGameResponse, GameStatus, SentenceDto } from '../types/game.types'
import { canAdvance } from '../utils/charStatus'

export interface GameState {
  status: GameStatus
  /** 완료 API 호출에 필요한 세션 ID. Backend가 발급한다. */
  sessionId: number | null
  /** Backend가 내려준 순서 그대로의 문장 목록 */
  sentences: SentenceDto[]
  /** 현재 입력 중인 문장의 인덱스 (0-based) */
  currentIndex: number
  /** 현재 문장에 대한 사용자 입력값 */
  input: string
  /** 한글 IME 조합 진행 여부 */
  isComposing: boolean
  /** 프론트가 측정한 공식 기록. FINISH 시점에 확정된다. */
  elapsedMs: number | null
  /** 완료 API 응답. PB/랭킹은 전부 여기(=Backend) 값만 쓴다. */
  result: CompleteGameResponse | null
  /** 완료 API 실패 시의 에러 코드 */
  errorCode: ApiErrorCode | null
}

export type GameAction =
  /** 세션 생성 성공 → 문장을 주입하고 시작 대기(READY) 상태로 만든다 */
  | { type: 'INIT_SESSION'; sessionId: number; sentences: SentenceDto[] }
  /** 시작 버튼 클릭 → 3초 카운트다운 시작 */
  | { type: 'START_COUNTDOWN' }
  /** 카운트다운 종료 → 첫 문장 공개 + 시간 측정 시작 */
  | { type: 'START_PLAYING' }
  /** 입력창 값 변경 */
  | { type: 'TYPE_INPUT'; value: string }
  /** compositionstart / compositionend 반영 */
  | { type: 'SET_COMPOSING'; isComposing: boolean }
  /** 문장 정확히 입력 후 Enter → 다음 문장으로 (마지막 문장에서는 동작하지 않음) */
  | { type: 'NEXT_SENTENCE' }
  /** 마지막 문장 Enter → 기록 확정 후 완료 API 전송 대기(SUBMITTING) */
  | { type: 'FINISH'; elapsedMs: number }
  /** 완료 API 성공 → 결과 화면 */
  | { type: 'SUBMIT_SUCCESS'; result: CompleteGameResponse }
  /** 완료 API 실패 → 결과 화면에서 에러 안내 (재제출은 막는다) */
  | { type: 'SUBMIT_FAIL'; code: ApiErrorCode }

export const initialGameState: GameState = {
  status: 'READY',
  sessionId: null,
  sentences: [],
  currentIndex: 0,
  input: '',
  isComposing: false,
  elapsedMs: null,
  result: null,
  errorCode: null,
}

/** 현재 입력해야 할 문장 내용 */
export function selectCurrentSentence(state: GameState): string {
  return state.sentences[state.currentIndex]?.content ?? ''
}

/** 마지막 문장인지 여부 */
export function selectIsLastSentence(state: GameState): boolean {
  return state.sentences.length > 0 && state.currentIndex === state.sentences.length - 1
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...initialGameState,
        status: 'READY',
        sessionId: action.sessionId,
        sentences: action.sentences,
      }

    case 'START_COUNTDOWN':
      // 시작 버튼 연타로 카운트다운이 재시작되지 않도록 READY에서만 진입한다.
      if (state.status !== 'READY') return state
      return { ...state, status: 'COUNTDOWN' }

    case 'START_PLAYING':
      if (state.status !== 'COUNTDOWN') return state
      return { ...state, status: 'PLAYING' }

    case 'TYPE_INPUT':
      // SUBMITTING 이후에는 입력을 받지 않는다. (기록이 이미 확정된 상태)
      if (state.status !== 'PLAYING') return state
      return { ...state, input: action.value }

    case 'SET_COMPOSING':
      if (state.status !== 'PLAYING') return state
      return { ...state, isComposing: action.isComposing }

    case 'NEXT_SENTENCE': {
      if (state.status !== 'PLAYING') return state
      // 오타가 남아있거나 조합이 끝나지 않았으면 진행을 막는다.
      // (요구사항: 오타를 수정해야만 다음 문장으로 넘어갈 수 있다)
      if (!canAdvance(selectCurrentSentence(state), state.input, state.isComposing)) return state
      // 마지막 문장은 FINISH가 처리한다. 여기서 인덱스를 넘기면 범위를 벗어난다.
      if (selectIsLastSentence(state)) return state

      return { ...state, currentIndex: state.currentIndex + 1, input: '', isComposing: false }
    }

    case 'FINISH': {
      if (state.status !== 'PLAYING') return state
      if (!selectIsLastSentence(state)) return state
      if (!canAdvance(selectCurrentSentence(state), state.input, state.isComposing)) return state

      // SUBMITTING으로 넘어가는 순간부터 Enter 연타가 들어와도 위의 가드에 전부 걸린다.
      return { ...state, status: 'SUBMITTING', elapsedMs: action.elapsedMs }
    }

    case 'SUBMIT_SUCCESS':
      if (state.status !== 'SUBMITTING') return state
      return { ...state, status: 'RESULT', result: action.result, errorCode: null }

    case 'SUBMIT_FAIL':
      if (state.status !== 'SUBMITTING') return state
      // 실패해도 RESULT로 보낸다. PLAYING으로 되돌리면 기록이 다시 측정돼 신뢰할 수 없어진다.
      return { ...state, status: 'RESULT', result: null, errorCode: action.code }

    default:
      return state
  }
}

export function useGameReducer() {
  return useReducer(gameReducer, initialGameState)
}

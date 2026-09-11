/**
 * 타자게임 화면.
 * State Machine(useGameReducer) · 스톱워치(useStopwatch) · 완료 API를 연결하는 조립부다.
 * 판정 로직은 여기 두지 않고 전부 utils / reducer가 담당한다.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getApiErrorCode } from '@/shared/api/apiError'

import { CountdownOverlay } from '../components/CountdownOverlay'
import { GameResult } from '../components/GameResult'
import { ProgressBar } from '../components/ProgressBar'
import { SentenceDisplay } from '../components/SentenceDisplay'
import { Stopwatch } from '../components/Stopwatch'
import { TypingInput } from '../components/TypingInput'
import { useCompleteGame } from '../hooks/useGameQueries'
import {
  selectCurrentSentence,
  selectIsLastSentence,
  useGameReducer,
} from '../hooks/useGameReducer'
import { useStopwatch } from '../hooks/useStopwatch'
import { hasTypo as checkTypo } from '../utils/charStatus'
import type { GameLocationState } from './CategorySelectPage'

export function GamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = (location.state as GameLocationState | null)?.session ?? null

  const [state, dispatch] = useGameReducer()
  const stopwatch = useStopwatch()
  const { mutate: submitRecord } = useCompleteGame()

  const currentSentence = selectCurrentSentence(state)
  const isLastSentence = selectIsLastSentence(state)
  const hasTypo = checkTypo(currentSentence, state.input, state.isComposing)

  // 세션 없이 /game/play로 직접 들어온 경우(새로고침 포함)에는 채널 선택으로 되돌린다.
  useEffect(() => {
    if (!session) navigate('/game/category', { replace: true })
  }, [session, navigate])

  // 세션이 준비되면 문장을 reducer에 주입한다.
  useEffect(() => {
    if (!session) return
    dispatch({
      type: 'INIT_SESSION',
      sessionId: session.gameSessionId,
      sentences: session.sentences,
    })
  }, [session, dispatch])

  /** 카운트다운이 끝나는 순간 = 공식 기록 측정 시작점 */
  const handleCountdownComplete = useCallback(() => {
    dispatch({ type: 'START_PLAYING' })
    stopwatch.start()
  }, [stopwatch, dispatch])

  /** 문장을 정확히 입력하고 Enter를 눌렀을 때 */
  const handleSubmitSentence = useCallback(() => {
    if (!isLastSentence) {
      dispatch({ type: 'NEXT_SENTENCE' })
      return
    }
    // 마지막 문장이면 여기서 시간 측정을 끝내고 그 값을 공식 기록으로 확정한다.
    const elapsedMs = stopwatch.stop()
    dispatch({ type: 'FINISH', elapsedMs })
  }, [isLastSentence, stopwatch, dispatch])

  // SUBMITTING에 진입하면 완료 API를 딱 한 번 보낸다.
  // StrictMode의 이펙트 2회 실행이나 재렌더로 중복 전송되지 않도록 ref로 잠근다.
  const submittedRef = useRef(false)
  useEffect(() => {
    if (state.status !== 'SUBMITTING') return
    if (state.sessionId === null || state.elapsedMs === null) return
    if (submittedRef.current) return
    submittedRef.current = true

    submitRecord(
      { gameSessionId: state.sessionId, elapsedMs: state.elapsedMs },
      {
        onSuccess: (result) => dispatch({ type: 'SUBMIT_SUCCESS', result }),
        onError: (error) => dispatch({ type: 'SUBMIT_FAIL', code: getApiErrorCode(error) }),
      },
    )
  }, [state.status, state.sessionId, state.elapsedMs, submitRecord, dispatch])

  if (!session) return null

  if (state.status === 'RESULT') {
    return (
      <main className="flex min-h-full items-center justify-center px-4 py-10">
        <GameResult
          elapsedMs={state.elapsedMs}
          result={state.result}
          errorCode={state.errorCode}
          onRestart={() => navigate('/game/category', { replace: true })}
        />
      </main>
    )
  }

  if (state.status === 'READY') {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <p className="text-sm font-semibold tracking-widest text-onair">{session.category.name}</p>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">준비되셨나요?</h1>
        <p className="text-ink-muted">
          시작을 누르면 3초 뒤 첫 문장이 공개되고 기록 측정이 시작됩니다
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'START_COUNTDOWN' })}
          className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-surface transition-opacity hover:opacity-90"
        >
          방송 시작
        </button>
      </main>
    )
  }

  const isPlaying = state.status === 'PLAYING'

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-8 px-4 py-10">
      {state.status === 'COUNTDOWN' && <CountdownOverlay onComplete={handleCountdownComplete} />}

      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-widest text-onair">
            {session.category.name}
          </span>
          <Stopwatch elapsedMs={stopwatch.displayMs} isRunning={isPlaying} />
        </div>
        <ProgressBar current={state.currentIndex + 1} total={state.sentences.length} />
      </header>

      <section className="rounded-2xl border border-line bg-surface-card px-5 py-7 sm:px-8 sm:py-9">
        <SentenceDisplay
          sentence={currentSentence}
          input={state.input}
          isComposing={state.isComposing}
        />
      </section>

      <TypingInput
        value={state.input}
        target={currentSentence}
        hasTypo={hasTypo}
        // SUBMITTING 중에는 입력과 Enter를 전부 막아 완료 요청이 중복되지 않게 한다.
        disabled={!isPlaying}
        onChange={(value) => dispatch({ type: 'TYPE_INPUT', value })}
        onComposingChange={(isComposing) => dispatch({ type: 'SET_COMPOSING', isComposing })}
        onSubmitSentence={handleSubmitSentence}
      />

      {state.status === 'SUBMITTING' && (
        <p className="text-center text-sm text-ink-muted">기록을 전송하는 중입니다...</p>
      )}
    </main>
  )
}

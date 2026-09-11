/**
 * 타자게임 화면.
 * State Machine(useGameReducer) · 스톱워치(useStopwatch) · 완료 API를 연결하는 조립부다.
 * 판정 로직은 여기 두지 않고 전부 utils / reducer가 담당한다.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getApiErrorCode } from '@/shared/api/apiError'
import { countMatchedKeystrokes } from '@/shared/utils/typingCount'

import { CountdownOverlay } from '../components/CountdownOverlay'
import { GameMeters } from '../components/GameMeters'
import { KoreaMap } from '../components/KoreaMap'
import { GameResult } from '../components/GameResult'
import { ProgressBar } from '../components/ProgressBar'
import { SentenceDisplay } from '../components/SentenceDisplay'
import { TypingInput } from '../components/TypingInput'
import { useCompleteGame } from '../hooks/useGameQueries'
import {
  selectCurrentSentence,
  selectIsLastSentence,
  useGameReducer,
} from '../hooks/useGameReducer'
import { useStopwatch } from '../hooks/useStopwatch'
import { useTypingInput } from '../hooks/useTypingInput'
import { hasTypo as checkTypo, matchedPrefixLength } from '../utils/charStatus'
import { calculateCpm } from '../utils/typingSpeed'
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
  const isPlaying = state.status === 'PLAYING'

  // 누적 타건 수 = 통과한 문장들 + 현재 문장에서 앞에서부터 일치하는 구간.
  // 오타 이후 구간은 세지 않으므로 오타를 고치는 동안에는 타수가 내려간다.
  const keystrokes =
    state.completedKeystrokes + countMatchedKeystrokes(currentSentence, state.input)

  // 지도는 CH.02(전국 대학)에서만 보여준다.
  const showMap = session?.category.code === 'CH02'
  // sentences는 세션이 정해질 때 한 번만 세팅되므로 참조가 안정적이다.
  const universityNames = useMemo(
    () => state.sentences.map((item) => item.content),
    [state.sentences],
  )
  const routeProgress =
    currentSentence.length > 0
      ? matchedPrefixLength(currentSentence, state.input) / currentSentence.length
      : 0

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
    // 마지막 문장이면 이 순간의 경과 시간을 공식 기록으로 확정한다.
    dispatch({ type: 'FINISH', elapsedMs: stopwatch.getElapsedMs() })
  }, [isLastSentence, stopwatch, dispatch])

  const { inputRef, isFocused, focusInput, inputProps } = useTypingInput({
    target: currentSentence,
    disabled: !isPlaying,
    onChange: useCallback((value: string) => dispatch({ type: 'TYPE_INPUT', value }), [dispatch]),
    onComposingChange: useCallback(
      (composing: boolean) => dispatch({ type: 'SET_COMPOSING', isComposing: composing }),
      [dispatch],
    ),
    onSubmitSentence: handleSubmitSentence,
  })

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
          // 최종 평균 타수. 표시 전용이라 완료 API에는 보내지 않는다.
          cpm={calculateCpm(state.completedKeystrokes, state.elapsedMs ?? 0)}
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
          게임 시작
        </button>
      </main>
    )
  }

  return (
    <main
      // 화면 아무 곳이나 누르면 숨겨진 입력창으로 포커스를 되돌린다.
      // mousedown에서 preventDefault를 해야 브라우저가 포커스를 다른 곳으로 옮기지 않는다.
      onMouseDown={(event) => {
        event.preventDefault()
        focusInput()
      }}
      className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-10 px-4 py-10"
    >
      {state.status === 'COUNTDOWN' && <CountdownOverlay onComplete={handleCountdownComplete} />}

      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold tracking-widest text-onair sm:text-sm">
            {session.category.name}
          </span>
          {/* 타이머는 이 안에서만 돈다. PLAYING이 끝나면 즉시 정지한다. */}
          <GameMeters
            running={isPlaying}
            getElapsedMs={stopwatch.getElapsedMs}
            keystrokes={keystrokes}
          />
        </div>
        {/* 전체 개수는 카테고리마다 다르므로(CH02는 20개) 배열 길이를 그대로 쓴다. */}
        <ProgressBar current={state.currentIndex + 1} total={state.sentences.length} />
      </header>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10">
        {showMap && (
          <KoreaMap
            names={universityNames}
            currentIndex={state.currentIndex}
            progress={routeProgress}
            // 좁은 화면에서는 지도를 숨기고 타이핑만 남긴다.
            // 지도가 타이핑 영역보다 커 보이면 안 되므로 폭을 제한한다.
            className="hidden w-full max-w-[200px] shrink-0 sm:block lg:max-w-[240px]"
          />
        )}

        {/* 문장이 화면에서 가장 큰 요소다. 주변 UI는 상대적으로 작게 둔다. */}
        <section className="flex min-h-[9rem] w-full flex-1 items-center justify-center sm:min-h-[12rem]">
          <SentenceDisplay
            sentence={currentSentence}
            input={state.input}
            isComposing={state.isComposing}
          />
        </section>
      </div>

      <TypingInput
        value={state.input}
        // SUBMITTING 중에는 입력과 Enter를 전부 막아 완료 요청이 중복되지 않게 한다.
        disabled={!isPlaying}
        inputRef={inputRef}
        inputProps={inputProps}
      />

      <p className="min-h-[1.5rem] text-center text-sm" role="status">
        {state.status === 'SUBMITTING' ? (
          <span className="text-ink-muted">기록을 전송하는 중입니다...</span>
        ) : hasTypo ? (
          <span className="text-typing-typo">오타를 수정해야 다음으로 넘어갈 수 있어요</span>
        ) : !isFocused && isPlaying ? (
          <span className="text-ink-muted">클릭해서 계속 입력하세요</span>
        ) : (
          <span className="text-ink-dim">정확히 입력한 뒤 Enter를 누르세요</span>
        )}
      </p>
    </main>
  )
}

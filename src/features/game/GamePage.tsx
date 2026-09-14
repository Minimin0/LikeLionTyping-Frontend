import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Check, Keyboard } from 'lucide-react'
import { useCallback, useReducer, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../../app/session'
import { ApiError, errorMessage } from '../../shared/api/client'
import {
  completeGameWithRecovery,
  getGame,
  startGame,
} from '../../shared/api/endpoints'
import {
  Alert,
  Busy,
  buttonClass,
  panelClass,
  secondaryButtonClass,
} from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'
import { countMatchedKeystrokes } from '../../shared/utils/typingCount'
import { CountdownOverlay } from './components/CountdownOverlay'
import { GameMeters } from './components/GameMeters'
import { ProgressBar } from './components/ProgressBar'
import { SentenceDisplay } from './components/SentenceDisplay'
import { TypingInput } from './components/TypingInput'
import { useTypingInput } from './hooks/useTypingInput'
import { gameReducer } from './gameMachine'
import onAirOff from '../../shared/brand/images/on-air-off.png'
import onAirOn from '../../shared/brand/images/on-air-on.png'

const now = () => performance.timeOrigin + performance.now()

export function GamePage() {
  const { categoryId: categoryParam } = useParams()
  const categoryId = Number(categoryParam)
  const navigate = useNavigate()
  const { participant, activeGame, setActiveGame } = useSession()
  const game = activeGame?.category.id === categoryId ? activeGame : null
  const [state, dispatch] = useReducer(gameReducer, {
    phase: game?.startedAtMs ? 'PLAYING' : 'READY',
    error: null,
  })
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const submitLock = useRef(false)

  const complete = useMutation({
    mutationFn: ({ id, elapsedMs }: { id: number; elapsedMs: number }) =>
      completeGameWithRecovery(id, elapsedMs),
    onSuccess: (result) => {
      dispatch({ type: 'RESULT' })
      setActiveGame(null)
      navigate(
        `${ROUTES.RESULT(result.gameSessionId)}?categoryId=${categoryId}`,
        {
          replace: true,
          state: result,
        },
      )
    },
    onError: (error) => dispatch({ type: 'FAIL', error: errorMessage(error) }),
  })

  const recover = useMutation({
    mutationFn: () => getGame(game!.gameSessionId),
    onSuccess: (result) => {
      if (result.status === 'COMPLETED') {
        setActiveGame(null)
        navigate(
          `${ROUTES.RESULT(result.gameSessionId)}?categoryId=${categoryId}`,
          {
            replace: true,
            state: result,
          },
        )
      } else if (result.status === 'IN_PROGRESS') {
        submitLock.current = false
        dispatch({ type: 'PLAY' })
      } else {
        dispatch({
          type: 'FAIL',
          error: errorMessage(new ApiError('INVALID_GAME_STATE', 409)),
        })
      }
    },
    onError: (error) => dispatch({ type: 'FAIL', error: errorMessage(error) }),
  })

  const start = useMutation({
    mutationFn: () => startGame(participant!.participantId, categoryId),
    onSuccess: (data) =>
      setActiveGame({ ...data, currentIndex: 0, startedAtMs: null }),
  })

  // 카운트다운이 0이 되는 순간(CountdownOverlay의 onComplete) 호출된다.
  // 이 시점이 공식 기록의 시작점이라 now()는 여기서 단 한 번만 찍는다.
  const handleCountdownComplete = useCallback(() => {
    const startedAtMs = now()
    setActiveGame({ ...game!, startedAtMs })
    dispatch({ type: 'PLAY' })
  }, [game, setActiveGame])

  // early return보다 먼저 선언해야 하는 훅들이라 game/sentence가 아직 없을 수 있다.
  // (Rules of Hooks: 아래 !participant / !game 가드보다 위에서 항상 같은 순서로 호출)
  const sentence = game ? game.sentences[game.currentIndex] : undefined

  // 카운트다운 시작 시각(game.startedAtMs) 기준 경과 시간. 새로고침 복구와 같은
  // 절대 시각 기준(now())을 그대로 쓰므로 표시값과 공식 기록이 어긋나지 않는다.
  const getElapsedMs = useCallback(
    () => (game?.startedAtMs ? now() - game.startedAtMs : 0),
    [game],
  )

  // useTypingInput이 "조합 중이 아니고 입력이 문장과 정확히 일치할 때"만 호출한다.
  const handleSubmitSentence = useCallback(() => {
    if (!game || !sentence || state.phase !== 'PLAYING') return
    if (game.currentIndex < game.sentences.length - 1) {
      setInput('')
      setActiveGame({ ...game, currentIndex: game.currentIndex + 1 })
      return
    }
    if (submitLock.current) return
    submitLock.current = true
    dispatch({ type: 'SUBMIT' })
    complete.mutate({
      id: game.gameSessionId,
      elapsedMs: Math.max(1, Math.round(now() - game.startedAtMs!)),
    })
  }, [complete, game, sentence, setActiveGame, state.phase])

  const { inputRef, inputProps, focusInput } = useTypingInput({
    target: sentence?.content ?? '',
    disabled: state.phase !== 'PLAYING',
    onChange: setInput,
    onComposingChange: setIsComposing,
    onSubmitSentence: handleSubmitSentence,
  })

  // 참가자 정보가 없으면 참가자 확인 화면으로 보낸다. (팀 확정: 목적지만 /participate)
  if (!participant) return <Navigate to={ROUTES.PARTICIPATE} replace />
  if (!Number.isInteger(categoryId))
    return <Navigate to={ROUTES.CATEGORIES} replace />

  if (activeGame && !game)
    return (
      <section className={panelClass}>
        <Alert>다른 카테고리의 진행 중 경기가 있습니다.</Alert>
        <Link
          className={`${buttonClass} mt-5 w-full`}
          to={ROUTES.GAME(activeGame.category.id)}
        >
          진행 중 경기로 이동
        </Link>
      </section>
    )

  if (!game)
    return (
      <section className={panelClass}>
        <Link
          className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-zinc-600"
          to={ROUTES.CATEGORIES}
        >
          <ArrowLeft className="size-4" />
          카테고리
        </Link>
        <h1 className="text-2xl font-black">게임 준비</h1>
        <p className="mt-2 text-zinc-600">
          시작하면 이용권 1장이 사용되고 서버에서 5개 문장을 불러옵니다.
        </p>
        {start.error && (
          <div className="mt-5">
            <Alert>{errorMessage(start.error)}</Alert>
          </div>
        )}
        <button
          className={`${buttonClass} mt-7 w-full`}
          disabled={start.isPending}
          onClick={() => start.mutate()}
        >
          {start.isPending ? <Busy label="경기 생성 중" /> : '게임 시작'}
        </button>
      </section>
    )

  const progress = `${game.currentIndex + 1} / ${game.sentences.length}`
  // 정확히 입력된 구간의 누적 타건 수. GameMeters의 실시간 타수 계산에만 쓰이는
  // 표시 전용 값이라 별도 state 없이 렌더마다 다시 계산한다.
  const keystrokes = sentence ? countMatchedKeystrokes(sentence.content, input) : 0

  return (
    // 게임 상태 기계·IME 입력·복구 로직은 그대로 두고 방송 화면 프레임만 적용한다.
    <section className={`${panelClass} radio-game-page`}>
      <div className="radio-game-studio overflow-hidden p-6 text-ink sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-accent">{game.category.code}</p>
            <h1 className="text-xl font-black text-ink">{game.category.name}</h1>
          </div>
          <span className="font-mono text-sm font-bold text-ink-muted">
            {progress}
          </span>
        </div>
        {/* 표시 전용: 기존 게임 phase를 읽어서 ON AIR 이미지 상태만 보여준다. */}
        <img
          className="radio-on-air-asset"
          src={state.phase === 'PLAYING' ? onAirOn : onAirOff}
          alt={state.phase === 'PLAYING' ? 'ON AIR 방송 중' : '방송 대기 중'}
        />
        <div className="mb-7">
          <ProgressBar current={game.currentIndex + 1} total={game.sentences.length} />
        </div>

        {state.phase === 'READY' && (
          <div className="py-12 text-center">
            <Keyboard className="mx-auto mb-4 size-10 text-accent" />
            <button
              className={buttonClass}
              onClick={() => dispatch({ type: 'COUNTDOWN' })}
            >
              3초 카운트다운 시작
            </button>
          </div>
        )}
        {state.phase === 'COUNTDOWN' && (
          <CountdownOverlay onComplete={handleCountdownComplete} />
        )}
        {state.phase === 'PLAYING' && sentence && (
          // 화면 아무 곳이나 눌러도 숨겨진 입력창으로 포커스가 돌아온다.
          <div onClick={focusInput}>
            <SentenceDisplay
              sentence={sentence.content}
              input={input}
              isComposing={isComposing}
            />
            <TypingInput
              value={input}
              disabled={state.phase !== 'PLAYING'}
              inputRef={inputRef}
              inputProps={inputProps}
            />
            <div className="mt-6 flex justify-end">
              <GameMeters
                running={state.phase === 'PLAYING'}
                getElapsedMs={getElapsedMs}
                keystrokes={keystrokes}
              />
            </div>
          </div>
        )}
        {state.phase === 'SUBMITTING' && (
          <div className="grid min-h-52 place-items-center text-center">
            <div>
              <Busy label="기록 저장 확인 중" />
              <p className="mt-3 text-sm text-ink-muted">
                새 경기를 시작하지 마세요.
              </p>
            </div>
          </div>
        )}
      </div>
      {state.error && (
        <div className="mt-5 space-y-3">
          <Alert>{state.error}</Alert>
          <button
            className={`${secondaryButtonClass} w-full`}
            disabled={recover.isPending}
            onClick={() => recover.mutate()}
          >
            {recover.isPending ? (
              <Busy label="확인 중" />
            ) : (
              <>
                <Check className="size-4" />
                저장 상태 다시 확인
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}

import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Check, Keyboard } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
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
import { canAdvanceSentence, gameReducer } from './gameMachine'

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
  const [countdown, setCountdown] = useState(3)
  const [input, setInput] = useState('')
  const composing = useRef(false)
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

  useEffect(() => {
    if (state.phase !== 'COUNTDOWN') return
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown((value) => value - 1)
      else {
        const startedAtMs = now()
        setActiveGame({ ...game!, startedAtMs })
        dispatch({ type: 'PLAY' })
      }
    }, 1_000)
    return () => window.clearTimeout(timer)
  }, [countdown, game, setActiveGame, state.phase])

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

  const sentence = game.sentences[game.currentIndex]
  const progress = `${game.currentIndex + 1} / ${game.sentences.length}`

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sentence || state.phase !== 'PLAYING') return
    if (event.key === 'Enter') event.preventDefault()
    if (
      !canAdvanceSentence(
        event.key,
        composing.current || event.nativeEvent.isComposing,
        input,
        sentence.content,
      )
    )
      return
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
  }

  return (
    <section className={panelClass}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            {game.category.code}
          </p>
          <h1 className="text-xl font-black">{game.category.name}</h1>
        </div>
        <span className="font-mono text-sm font-bold">{progress}</span>
      </div>
      <div className="mb-7 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full bg-emerald-600 transition-all"
          style={{ width: `${((game.currentIndex + 1) / 5) * 100}%` }}
        />
      </div>

      {state.phase === 'READY' && (
        <div className="py-12 text-center">
          <Keyboard className="mx-auto mb-4 size-10 text-emerald-700" />
          <button
            className={buttonClass}
            onClick={() => {
              setCountdown(3)
              dispatch({ type: 'COUNTDOWN' })
            }}
          >
            3초 카운트다운 시작
          </button>
        </div>
      )}
      {state.phase === 'COUNTDOWN' && (
        <div className="grid min-h-52 place-items-center" aria-live="assertive">
          <strong className="text-7xl font-black text-emerald-700">
            {countdown}
          </strong>
        </div>
      )}
      {state.phase === 'PLAYING' && sentence && (
        <div>
          <p className="mb-5 min-h-20 border-y border-zinc-200 py-5 text-center text-xl font-bold leading-relaxed sm:text-2xl">
            {sentence.content}
          </p>
          <label className="block text-sm font-bold text-zinc-600">
            문장을 정확히 입력하고 Enter
            <textarea
              autoFocus
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border-2 border-zinc-300 p-4 text-lg outline-none focus:border-emerald-700"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={() => {
                composing.current = false
              }}
              onKeyDown={handleKeyDown}
            />
          </label>
          {input && input !== sentence.content && (
            <p className="mt-2 text-sm text-red-700">
              문장이 정확히 일치하지 않습니다.
            </p>
          )}
        </div>
      )}
      {state.phase === 'SUBMITTING' && (
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <Busy label="기록 저장 확인 중" />
            <p className="mt-3 text-sm text-zinc-500">
              새 경기를 시작하지 마세요.
            </p>
          </div>
        </div>
      )}
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

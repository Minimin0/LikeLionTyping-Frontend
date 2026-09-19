import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../../app/session'
import { ApiError, errorMessage } from '../../shared/api/client'
import {
  completeGameWithRecovery,
  getCategories,
  getGame,
  getParticipantPlayState,
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
import { ParticipantStatus } from '../../shared/ParticipantStatus'
import { displayCategoryName } from '../../shared/utils/categoryDisplay'
import { countKeystrokesOfText, countMatchedKeystrokes } from '../../shared/utils/typingCount'
import { CountdownOverlay } from './components/CountdownOverlay'
import { ProgressBar } from './components/ProgressBar'
import { SentenceDisplay } from './components/SentenceDisplay'
import { TypingInput } from './components/TypingInput'
import { TypewriterKeyOverlay } from './components/TypewriterKeyOverlay'
import { useTypingInput } from './hooks/useTypingInput'
import { gameReducer } from './gameMachine'
import writerMain from '../../shared/brand/images/writer_main.png'
import { calculateCpm } from './utils/typingSpeed'
import { formatElapsedMs } from '../../shared/utils/formatTime'

const now = () => performance.timeOrigin + performance.now()

export function GamePage() {
  const { categoryId: categoryParam } = useParams()
  const categoryId = Number(categoryParam)
  const navigate = useNavigate()
  const { participant, activeGame, setParticipant, setActiveGame } = useSession()
  const game = activeGame?.category.id === categoryId ? activeGame : null
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const categoryRows = Array.isArray(categories.data) ? categories.data : []
  const selectedCategory = categoryRows.find(
    (category) => category.id === categoryId,
  )
  const selectedCategoryIndex = Math.max(
    0,
    categoryRows.findIndex((category) => category.id === categoryId),
  )
  const [state, dispatch] = useReducer(gameReducer, {
    phase: game?.startedAtMs ? 'PLAYING' : 'READY',
    error: null,
  })
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [activeCodes, setActiveCodes] = useState<Set<string>>(new Set())
  const [liveElapsedMs, setLiveElapsedMs] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)
  const submitLock = useRef(false)
  const playState = useQuery({
    queryKey: ['participant', 'play-state', participant?.participantId],
    queryFn: () => getParticipantPlayState(participant!.participantId),
    enabled: Boolean(participant && !game),
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!participant || game || !playState.data) return
    if (participant.availablePassCount === playState.data.availablePassCount)
      return
    setParticipant({
      ...participant,
      availablePassCount: playState.data.availablePassCount,
    })
  }, [game, participant, playState.data, setParticipant])

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
    onSuccess: (data) => {
      setActiveGame({ ...data, currentIndex: 0, startedAtMs: null })
      setParticipant({
        ...participant!,
        availablePassCount: data.availablePassCount,
      })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'NO_AVAILABLE_PASS') {
        setParticipant({ ...participant!, availablePassCount: 0 })
        playState.refetch()
      }
    },
  })

  // 카운트다운이 0이 되는 순간(CountdownOverlay의 onComplete) 호출된다.
  // 이 시점이 공식 기록의 시작점이라 now()는 여기서 단 한 번만 찍는다.
  const handleCountdownComplete = useCallback(() => {
    const startedAtMs = now()
    setActiveGame({ ...game!, startedAtMs })
    dispatch({ type: 'PLAY' })
  }, [game, setActiveGame, dispatch])

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
  }, [complete, game, sentence, setActiveGame, state.phase, dispatch])

  const { inputRef, inputProps, focusInput } = useTypingInput({
    target: sentence?.content ?? '',
    disabled: state.phase !== 'PLAYING',
    onChange: setInput,
    onComposingChange: setIsComposing,
    onSubmitSentence: handleSubmitSentence,
  })

  useEffect(() => {
    if (state.phase !== 'PLAYING') return
    const tick = window.setInterval(() => setLiveElapsedMs(getElapsedMs()), 100)
    const down = (event: KeyboardEvent) =>
      setActiveCodes((current) => new Set(current).add(event.code))
    const up = (event: KeyboardEvent) =>
      setActiveCodes((current) => {
        const next = new Set(current)
        next.delete(event.code)
        return next
      })
    const clear = () => setActiveCodes(new Set())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.clearInterval(tick)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [getElapsedMs, state.phase])

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

  if (!game && playState.isLoading)
    return (
      <section className={panelClass}>
        <Busy label="이용권 확인 중" />
      </section>
    )

  if (!game && playState.error)
    return (
      <section className={panelClass}>
        <Alert>{errorMessage(playState.error)}</Alert>
        <button
          className={`${buttonClass} mt-5 w-full`}
          onClick={() => playState.refetch()}
        >
          이용권 다시 확인
        </button>
      </section>
    )

  if (!game && playState.data?.activeGame)
    return (
      <section className={panelClass}>
        <Alert>
          진행 중인 경기가 있습니다. 이 경기는 이미 이용권이 사용되었습니다.
        </Alert>
        <button
          className={`${buttonClass} mt-5 w-full`}
          disabled={start.isPending}
          onClick={() =>
            playState.data.activeGame!.categoryId === categoryId
              ? start.mutate()
              : navigate(ROUTES.GAME(playState.data.activeGame!.categoryId))
          }
        >
          {start.isPending ? <Busy label="경기 불러오는 중" /> : '진행 중 경기 계속하기'}
        </button>
        {start.error && (
          <div className="mt-5">
            <Alert>{errorMessage(start.error)}</Alert>
          </div>
        )}
      </section>
    )

  if (!game && (playState.data?.availablePassCount ?? 0) === 0)
    return (
      <section className={panelClass}>
        <Alert>
          사용 가능한 이용권이 없습니다. 재도전하려면 운영자에게 이용권을 발급받아 주세요.
        </Alert>
        <button
          className={`${buttonClass} mt-5 w-full`}
          disabled={playState.isFetching}
          onClick={() => playState.refetch()}
        >
          {playState.isFetching ? <Busy label="확인 중" /> : '이용권 다시 확인'}
        </button>
      </section>
    )

  if (!game)
    return (
      <section className={`game-ready-stage game-ready-theme-${selectedCategoryIndex}`}>
        <div className="game-ready-card">
          <Link className="game-ready-category-link" to={ROUTES.CATEGORIES}>
            <ArrowLeft aria-hidden />
            카테고리 다시 고르기
          </Link>
          <p className="game-ready-channel">
            {selectedCategory
              ? `${selectedCategory.code} · ${displayCategoryName(selectedCategory)}`
              : '선택한 채널'}
          </p>
          <h1>게임 준비</h1>
          <p className="game-ready-description">
            시작하면 이용권 1장이 사용되고 서버에서 5개 문장을 불러옵니다.
          </p>
          <ParticipantStatus
            className="game-ready-participant-status"
            nickname={participant.nickname}
            availablePassCount={
              playState.data?.availablePassCount ?? participant.availablePassCount
            }
          />
          <ul className="game-ready-rules">
            <li>한 번에 한 문장씩 정확히 입력합니다.</li>
            <li>오타를 모두 고친 뒤 Enter를 누르면 다음 문장으로 넘어갑니다.</li>
            <li>마지막 5번째 문장을 완료하는 순간 공식 기록이 결정됩니다.</li>
          </ul>
          {start.error && (
            <div className="mt-5">
              <Alert>{errorMessage(start.error)}</Alert>
            </div>
          )}
          <button
            className="game-ready-start"
            disabled={start.isPending}
            onClick={() => start.mutate()}
          >
            {start.isPending ? <Busy label="경기 생성 중" /> : '게임 시작'}
          </button>
        </div>
      </section>
    )

  const progress = `${game.currentIndex + 1} / ${game.sentences.length}`
  // GameMeters에 넘기는 elapsedMs는 카운트다운이 끝난 뒤로 누적되는 "게임 전체"
  // 경과 시간이다(공식 기록 기준과 동일). 타수 분자도 같은 기준으로 맞춰야 해서,
  // 이미 끝낸 문장들의 타건 수(game.sentences/game.currentIndex — 새로고침 복구
  // 시에도 그대로 남아있는 값)에 현재 문장의 매칭 타건 수를 더한다. 문장이 넘어갈
  // 때마다 0으로 리셋되는 값을 누적 경과 시간과 그대로 나누면 타수가 실제보다
  // 훨씬 낮게 나온다.
  const completedKeystrokes = game.sentences
    .slice(0, game.currentIndex)
    .reduce((sum, s) => sum + countKeystrokesOfText(s.content), 0)
  const keystrokes =
    completedKeystrokes + (sentence ? countMatchedKeystrokes(sentence.content, input) : 0)
  const cpm = calculateCpm(keystrokes, liveElapsedMs)
  const progressPercent = Math.round(((game.currentIndex + 1) / game.sentences.length) * 100)
  const previousSentence = game.currentIndex > 0 ? game.sentences[game.currentIndex - 1]?.content : ''
  const showExit = state.phase === 'READY' || state.phase === 'COUNTDOWN' || state.phase === 'PLAYING'
  // 타이핑 시작 전(READY·COUNTDOWN)에는 「게임 준비」와 같은 정사각형 카드를 쓰고,
  // 문장이 나오는 순간(PLAYING·SUBMITTING) 원래 폭으로 돌아간다.
  const isPrepPhase = state.phase === 'READY' || state.phase === 'COUNTDOWN'

  return (
    // 게임 상태 기계·IME 입력·복구 로직은 그대로 두고 방송 화면 프레임만 적용한다.
    <section className={`${panelClass} radio-game-page`}>
      <div
        className={`radio-game-studio overflow-hidden text-ink ${
          isPrepPhase ? 'radio-game-studio--compact' : 'p-6 sm:p-8'
        }`}
      >
        {showExit && !isPrepPhase && (
          <button
            type="button"
            className="game-exit-button"
            onClick={() => setExitOpen(true)}
          >
            게임 종료
          </button>
        )}
        {state.phase !== 'PLAYING' && (
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-accent">{game.category.code}</p>
              <h1 className="text-xl font-black text-ink">{displayCategoryName(game.category)}</h1>
            </div>
            <span className="font-mono text-sm font-bold text-ink-muted">
              {progress}
            </span>
          </div>
        )}
        {state.phase !== 'PLAYING' && (
          <div className="radio-off-air-sign radio-off-air-sign--game" role="img" aria-label="OFF 방송 대기 중">OFF</div>
        )}
        {state.phase !== 'PLAYING' && (
          <div className="mb-7">
            <ProgressBar current={game.currentIndex + 1} total={game.sentences.length} />
          </div>
        )}
        {state.phase !== 'PLAYING' && (
          <BroadcastProgress current={-1} total={game.sentences.length} />
        )}

        {state.phase === 'READY' && (
          <div className="game-ready">
            <button
              className={`${buttonClass} game-ready-button`}
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
          <div className="typewriter-game-stage" onClick={focusInput}>
            <div className="typewriter-on-air-sign" role="img" aria-label="ON AIR 방송 중">ON AIR</div>
            <p className="typewriter-wall-note typewriter-wall-note-left">GOOD<br />WORDS<br />BETTER<br />TOMORROW</p>
            <p className="typewriter-wall-note typewriter-wall-note-right">Keep<br />Typing.<br />Keep Going.</p>
            <div className="typewriter-left-meters">
              <MetricCard label="채널" value={`${game.category.code} ${displayCategoryName(game.category)}`} />
              <MetricCard label="경과 시간" value={formatElapsedMs(liveElapsedMs)} className="typewriter-metric-card--elapsed" />
              <MetricCard label="CPM" value={cpm} />
            </div>
            <div className="typewriter-hero" aria-label="타자 게임 진행 화면">
              <img src={writerMain} alt="" aria-hidden />
              <div className={`typewriter-paper-copy${sentence.content.length > 38 ? ' typewriter-paper-copy--dense' : ''}`}>
                <p className="typewriter-previous">{previousSentence}</p>
                <div className="typewriter-current" key={game.currentIndex}>
                  <SentenceDisplay
                    sentence={sentence.content}
                    input={input}
                    isComposing={isComposing}
                  />
                </div>
              </div>
              <TypewriterKeyOverlay activeCodes={activeCodes} />
            </div>
            <div className="typewriter-right-meters">
              <MetricCard label="문장" value={progress} />
              <div className="typewriter-progress-card">
                <span>진행률</span>
                <strong>{progressPercent}%</strong>
                <BroadcastProgress current={game.currentIndex} total={game.sentences.length} />
                <div>
                  <i style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
            <TypingInput
              value={input}
              disabled={state.phase !== 'PLAYING'}
              inputRef={inputRef}
              inputProps={inputProps}
            />
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
      {isPrepPhase && (
        <button
          type="button"
          className="game-exit-button game-exit-button--prep"
          onClick={() => setExitOpen(true)}
        >
          게임 종료
        </button>
      )}
      {exitOpen && (
        <div className="game-exit-modal-backdrop" role="presentation">
          <div
            className="game-exit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-exit-title"
          >
            <h2 id="game-exit-title">게임을 종료할까요?</h2>
            <p>지금 나가면 진행 중인 화면에서 벗어납니다. 계속하시겠습니까?</p>
            <div>
              <button type="button" onClick={() => setExitOpen(false)}>
                계속하기
              </button>
              <button type="button" onClick={() => navigate(ROUTES.CATEGORIES)}>
                종료하기
              </button>
            </div>
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

function MetricCard({ label, value, className = '' }: { label: string; value: number | string; className?: string }) {
  return (
    <div className={`typewriter-metric-card ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BroadcastProgress({ current, total }: { current: number; total: number }) {
  return (
    <ol className="broadcast-progress" aria-label="문장 진행 단계">
      {Array.from({ length: total }, (_, index) => {
        const active = index === current
        const done = index < current
        return (
          <li
            key={index}
            className={`${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <span>{index + 1}</span>
          </li>
        )
      })}
    </ol>
  )
}

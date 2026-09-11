/**
 * 채널(카테고리) 선택 화면.
 * 채널을 고르고 시작하면 POST /api/game-sessions로 세션을 만든 뒤 게임 화면으로 이동한다.
 */
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorCode, type ApiErrorCode } from '@/shared/api/apiError'

import { NoPassNotice } from '../components/NoPassNotice'
import { CHANNEL_PRESENTATION, MOCK_PARTICIPANT_ID } from '../constants/game.constants'
import { useCategories, useStartGame } from '../hooks/useGameQueries'
import type { GameSessionResponse } from '../types/game.types'

/** GamePage로 세션을 넘길 때 쓰는 라우터 state */
export interface GameLocationState {
  session: GameSessionResponse
}

export function CategorySelectPage() {
  const navigate = useNavigate()
  const { data: categories, isLoading, isError } = useCategories()
  const startGame = useStartGame()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [blockedCode, setBlockedCode] = useState<ApiErrorCode | null>(null)
  /** 세션 생성 요청이 이미 나갔는지. 연타로 PlayPass가 중복 소비되는 것을 막는다. */
  const requestLockRef = useRef(false)

  const handleStart = () => {
    if (selectedId === null) return

    // isPending은 리렌더가 한 번 일어난 뒤에야 true가 되므로, 같은 프레임 안에서 들어온
    // 연타는 막지 못한다. 실제로 이 경우 PlayPass가 클릭 수만큼 소비되기 때문에
    // 요청 직전에 ref로 즉시 잠근다. (버튼 disabled는 시각적 피드백용)
    if (requestLockRef.current) return
    requestLockRef.current = true

    startGame.mutate(
      // TODO: 백엔드 연동 시 교체 — participantId는 FE2의 participants/identify 응답 값을 쓴다.
      { participantId: MOCK_PARTICIPANT_ID, categoryId: selectedId },
      {
        onSuccess: (session) => {
          const state: GameLocationState = { session }
          navigate('/game/play', { state })
        },
        // 게임 가능 여부의 최종 판단은 이 응답이다. 프론트가 미리 막지 않는다.
        onError: (error) => {
          // 실패한 요청은 Pass를 소비하지 않았으므로 다시 시도할 수 있어야 한다.
          requestLockRef.current = false
          setBlockedCode(getApiErrorCode(error))
        },
      },
    )
  }

  if (blockedCode) {
    return (
      <main className="flex min-h-full items-center justify-center px-4 py-10">
        <NoPassNotice code={blockedCode} onBack={() => setBlockedCode(null)} />
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-8 px-4 py-10">
      <header className="text-center">
        <p className="text-sm font-semibold tracking-widest text-onair">멋쟁이 타자처럼</p>
        <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">채널을 선택하세요</h1>
        {/* 항목 개수는 채널마다 다르므로(CH.02는 대학 20개) 숫자를 적지 않는다. */}
        <p className="mt-2 text-ink-muted">선택한 채널의 문장을 순서대로 입력하게 됩니다</p>
      </header>

      {isLoading && <p className="text-center text-ink-muted">채널을 불러오는 중입니다...</p>}
      {isError && (
        <p className="text-center text-typing-typo">
          채널을 불러오지 못했습니다. 운영진에게 문의해주세요.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {categories?.map((category) => {
          const presentation = CHANNEL_PRESENTATION[category.code]
          const isSelected = selectedId === category.id

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedId(category.id)}
              className={[
                'flex flex-col gap-3 rounded-2xl border-2 bg-surface-card p-5 text-left transition-colors',
                isSelected ? 'border-accent' : 'border-line hover:border-line-strong',
              ].join(' ')}
            >
              <span className="text-lg font-semibold text-ink">{category.name}</span>
              <span className="text-sm text-ink-muted">{presentation?.description}</span>
              {presentation?.preview && (
                <span className="mt-auto break-keep rounded-lg bg-surface-soft px-3 py-2 text-xs leading-relaxed text-ink-dim">
                  “{presentation.preview}”
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={selectedId === null || startGame.isPending}
        className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {startGame.isPending ? '주파수 맞추는 중...' : '방송 참여하기'}
      </button>
    </main>
  )
}

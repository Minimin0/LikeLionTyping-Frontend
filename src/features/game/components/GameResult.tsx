/**
 * 게임 결과 화면.
 *
 * 이번 기록(elapsedMs)만 프론트가 계산한 값이고,
 * 개인 최고 기록 / PB 여부 / 순위는 전부 Backend 응답을 그대로 보여준다.
 * 여기서 `if (elapsedMs < personalBestMs)` 같은 비교를 하면 안 된다.
 */
import { API_ERROR_MESSAGE, type ApiErrorCode } from '@/shared/api/apiError'
import { formatElapsedMs } from '@/shared/utils/formatTime'

import type { CompleteGameResponse } from '../types/game.types'

interface GameResultProps {
  /** 프론트가 측정한 이번 기록 */
  elapsedMs: number | null
  /** 완료 API 응답. 실패한 경우 null */
  result: CompleteGameResponse | null
  errorCode: ApiErrorCode | null
  onRestart: () => void
}

export function GameResult({ elapsedMs, result, errorCode, onRestart }: GameResultProps) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-line/60 px-4 py-1.5 text-sm font-semibold tracking-widest text-ink-muted">
          방송 완료
        </span>
        {result?.personalBest && (
          <span className="text-sm font-semibold text-accent">개인 최고 기록 경신</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-sm text-ink-muted">이번 기록</p>
        <p className="tabular text-6xl font-bold text-ink sm:text-7xl">
          {elapsedMs === null ? '--.---' : formatElapsedMs(elapsedMs)}
        </p>
      </div>

      {errorCode ? (
        <p className="w-full rounded-xl border border-typing-typo/40 bg-typing-typo/10 px-4 py-3 text-sm text-typing-typo">
          {API_ERROR_MESSAGE[errorCode]}
        </p>
      ) : (
        <dl className="grid w-full grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-surface-card px-4 py-4">
            <dt className="text-xs text-ink-muted">개인 최고 기록</dt>
            <dd className="tabular mt-1 text-xl font-semibold text-ink">
              {result ? formatElapsedMs(result.personalBestMs) : '--.---'}
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-surface-card px-4 py-4">
            <dt className="text-xs text-ink-muted">현재 순위</dt>
            <dd className="tabular mt-1 text-xl font-semibold text-ink">
              {result ? `${result.rank}위` : '집계 중'}
            </dd>
          </div>
        </dl>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="w-full rounded-xl bg-accent px-6 py-3.5 font-semibold text-surface transition-opacity hover:opacity-90"
      >
        채널 선택으로 돌아가기
      </button>
    </section>
  )
}

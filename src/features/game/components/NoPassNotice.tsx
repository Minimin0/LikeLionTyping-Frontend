/**
 * 이용권 소진(NO_AVAILABLE_PASS) 안내 화면.
 *
 * 이 화면은 POST /api/game-sessions가 409를 내려줬을 때만 나온다.
 * 프론트가 availablePassCount를 보고 미리 판단해서 띄우면 안 된다. (Backend Authority)
 */
import { API_ERROR_MESSAGE, type ApiErrorCode } from '@/shared/api/apiError'

interface NoPassNoticeProps {
  code: ApiErrorCode
  onBack: () => void
}

export function NoPassNotice({ code, onBack }: NoPassNoticeProps) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
      <span className="rounded-full bg-onair/15 px-4 py-1.5 text-sm font-semibold tracking-widest text-onair">
        방송 중단
      </span>

      <p className="whitespace-pre-line text-lg leading-relaxed text-ink">
        {API_ERROR_MESSAGE[code]}
      </p>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-xl border border-line-strong px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-surface-card"
      >
        돌아가기
      </button>
    </section>
  )
}

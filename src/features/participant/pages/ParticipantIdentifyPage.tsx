// 참가자 식별 폼. 서버 응답을 저장하고 팀원 B의 채널 선택 경로로 전달한다.
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { API_ERROR_MESSAGE, getApiErrorCode } from '@/shared/api/apiError'
import { useIdentifyParticipant } from '../hooks/useIdentifyParticipant'
import { participantSchema } from '../utils/participantValidation'
import { clearParticipantSession, saveParticipantSession } from '../session/participantSession'
import type { IdentifyParticipantRequest } from '../types/participant.types'
export function ParticipantIdentifyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useIdentifyParticipant()
  const locked = useRef(false)
  const [notice, setNotice] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IdentifyParticipantRequest>({ defaultValues: { nickname: '', phone: '' } })
  useEffect(() => {
    // 같은 키오스크의 다음 참가자가 이전 식별 결과를 이어받지 않도록 새 입력 진입 시 초기화한다.
    try {
      clearParticipantSession()
    } catch {
      setNotice('브라우저 저장소를 사용할 수 없습니다. 운영진에게 문의해주세요.')
    }
  }, [])
  const submit = async (values: IdentifyParticipantRequest) => {
    // React 재렌더링 전에 발생하는 연속 제출도 막는다.
    if (locked.current) return
    const parsed = participantSchema.safeParse(values)
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        setError(
          issue.path[0] as keyof IdentifyParticipantRequest,
          { message: issue.message },
          { shouldFocus: true },
        )
      return
    }
    locked.current = true
    setNotice('')
    let stored = false
    try {
      const participant = await mutation.mutateAsync(parsed.data)
      try {
        saveParticipantSession(participant)
        stored = true
      } catch {
        setNotice('참가 확인은 완료했지만 브라우저에 저장하지 못했습니다. 운영진에게 문의해주세요.')
        return
      }
      // 이용권 수는 표시용이다. 시작 허용 여부는 게임 시작 API가 최종 결정한다.
      navigate('/game/category', { replace: true })
    } catch (error) {
      const code = getApiErrorCode(error)
      setNotice(
        code === 'NETWORK_ERROR'
          ? '연결을 확인한 후 다시 시도해주세요. 계속 실패하면 운영진에게 문의해주세요.'
          : API_ERROR_MESSAGE[code],
      )
    } finally {
      locked.current = false
      // 식별 요청의 전화번호가 완료 뒤 Mutation 캐시에 남지 않도록 제거한다.
      mutation.reset()
      for (const item of queryClient
        .getMutationCache()
        .findAll({ mutationKey: ['identifyParticipant'] }))
        queryClient.getMutationCache().remove(item)
      if (stored) setNotice('')
    }
  }
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-ink-muted">
        ← 처음으로
      </Link>
      <p className="eyebrow mt-9">STEP 01 / CHECK IN</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">방송 전, 참가자 확인</h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        당신의 기록에 남길 이름을 알려주세요.
        <br />
        참가한 적이 있다면 기존 닉네임을 입력해주세요.
      </p>
      <form
        className="mt-9 rounded-3xl border border-line bg-surface-soft p-6 sm:p-9"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <div>
          <label htmlFor="nickname" className="field-label">
            닉네임
          </label>
          <input
            id="nickname"
            className="participant-input"
            placeholder="기록에 남길 닉네임"
            autoComplete="off"
            maxLength={20}
            aria-invalid={!!errors.nickname}
            aria-describedby={errors.nickname ? 'nickname-error' : 'nickname-help'}
            {...register('nickname')}
          />
          <p id="nickname-help" className="mt-2 text-xs text-ink-muted">
            전화번호 하나당 닉네임 하나를 사용하며, 등록 후 변경할 수 없어요.
          </p>
          {errors.nickname && (
            <p id="nickname-error" role="alert" className="field-error">
              {errors.nickname.message}
            </p>
          )}
        </div>
        <div className="mt-7">
          <label htmlFor="phone" className="field-label">
            전화번호
          </label>
          <input
            id="phone"
            className="participant-input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="010-0000-0000"
            aria-invalid={!!errors.phone}
            aria-describedby="phone-help phone-error"
            {...register('phone')}
          />
          <p id="phone-help" className="mt-2 text-xs text-ink-muted">
            하이픈 없이 입력해도 괜찮아요. 공개 랭킹에는 표시되지 않아요.
          </p>
          <p id="phone-error" role={errors.phone ? 'alert' : undefined} className="field-error">
            {errors.phone?.message}
          </p>
        </div>
        <details className="mt-6 rounded-xl border border-line p-4 text-sm text-ink-muted">
          <summary className="cursor-pointer text-ink">개인정보 수집 및 이용 안내</summary>
          <p className="mt-3 leading-relaxed">
            닉네임과 전화번호는 참가자 식별, 이용권 관리 및 행사 상품 지급에 사용됩니다. 행사 및
            상품 지급 종료 후 운영 정책에 따라 삭제됩니다. 정확한 삭제 일정은 운영진에게
            확인해주세요.
          </p>
        </details>
        {notice && (
          <p role="alert" className="mt-5 rounded-xl border border-line p-4 text-sm">
            {notice}
          </p>
        )}
        <button
          type="submit"
          className="primary-button mt-7 w-full"
          disabled={isSubmitting || mutation.isPending}
        >
          {isSubmitting ? '참가 확인 중…' : '확인하고 다음으로 →'}
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
          처음 참가하면 전체 채널 중 1회 무료로 참여할 수 있어요.
        </p>
      </form>
    </div>
  )
}

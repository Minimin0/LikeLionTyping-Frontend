import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useSession } from '../../app/session'
import { errorMessage } from '../../shared/api/client'
import { identifyParticipant } from '../../shared/api/endpoints'
import { ROUTES } from '../../shared/constants/routes'
import lpGreen from '../../shared/brand/images/LP_green.png'
import participantRadioCutout from '../../shared/brand/images/participant-radio-cutout.png'
import {
  Alert,
  Busy,
  buttonClass,
  inputClass,
  panelClass,
} from '../../shared/components'

const schema = z.object({
  nickname: z.string().trim().min(1, '닉네임을 입력해주세요.').max(40),
  phone: z
    .string()
    .trim()
    .regex(/^01\d[- ]?\d{3,4}[- ]?\d{4}$/, '휴대전화 번호를 확인해주세요.'),
  privacyConsent: z.literal(true, {
    message: '개인정보 수집 안내에 동의해주세요.',
  }),
})
type Form = z.infer<typeof schema>

export function ParticipantPage() {
  const navigate = useNavigate()
  const { participant, setParticipant, setActiveGame } = useSession()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })
  const identify = useMutation({
    mutationFn: ({ nickname, phone }: Form) =>
      identifyParticipant(nickname, phone),
    onSuccess: (data) => {
      setParticipant(data)
      setActiveGame(null)
      navigate(ROUTES.CATEGORIES)
    },
  })

  return (
    // 폼 검증과 참가자 식별 API는 유지하고, 중앙 정렬·배경 장식만 추가한다.
    <section className="radio-participant-stage">
      {/* 사용자가 제공한 카세트·헤드폰 사진에서 배경을 제거한 장식 이미지다. */}
      <img className="participant-studio-asset" src={participantRadioCutout} alt="" aria-hidden />
      <div className={`${panelClass} radio-participant-page`}>
      <div className="mb-8 flex items-start gap-4">
        {/* 참가자 확인 카드의 장식 아이콘. 홈 화면과 같은 초록 LP를 사용한다. */}
        <img className="participant-lp-icon" src={lpGreen} alt="" aria-hidden />
        <div>
          <h1 className="text-2xl font-black">참가자 확인</h1>
          <p className="mt-1 text-zinc-600">
            등록한 닉네임과 휴대전화 번호로 시작합니다.
          </p>
        </div>
      </div>
      {participant && (
        <p className="mb-5 rounded-lg bg-zinc-100 px-4 py-3 text-sm">
          <strong>{participant.nickname}</strong> 님으로 다시 참가할 수
          있습니다.
        </p>
      )}
      <form
        className="space-y-5"
        onSubmit={handleSubmit(({ nickname, phone }) =>
          identify.mutate({ nickname, phone, privacyConsent: true }),
        )}
      >
        <label className="block font-bold">
          닉네임
          <input
            className={`${inputClass} mt-2`}
            autoComplete="nickname"
            {...register('nickname')}
          />
        </label>
        {errors.nickname && (
          <p className="text-sm text-red-700">{errors.nickname.message}</p>
        )}
        <label className="block font-bold">
          휴대전화 번호
          <input
            className={`${inputClass} mt-2`}
            inputMode="tel"
            autoComplete="tel"
            placeholder="01012345678"
            {...register('phone')}
          />
        </label>
        {errors.phone && (
          <p className="text-sm text-red-700">{errors.phone.message}</p>
        )}
        {identify.error && <Alert>{errorMessage(identify.error)}</Alert>}
        <label className="participant-privacy-consent">
          <input type="checkbox" {...register('privacyConsent')} />
          <span>
            전화번호는 무료 참여 여부 확인, 게임 기록 관리, 본인 확인 및
            수상자 연락을 위해 수집합니다. 랭킹에는 공개되지 않습니다.
          </span>
        </label>
        {errors.privacyConsent && (
          <p className="text-sm text-red-700">{errors.privacyConsent.message}</p>
        )}
        <button
          className={`${buttonClass} w-full`}
          disabled={identify.isPending}
        >
          {identify.isPending ? (
            <Busy label="확인 중" />
          ) : (
            <>
              참가하기
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </form>
      </div>
    </section>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useSession } from '../../app/session'
import { errorMessage } from '../../shared/api/client'
import { identifyParticipant } from '../../shared/api/endpoints'
import { ROUTES } from '../../shared/constants/routes'
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
    <section className={panelClass}>
      <div className="mb-8 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
          <UserRound aria-hidden />
        </span>
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
        onSubmit={handleSubmit((values) => identify.mutate(values))}
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
    </section>
  )
}

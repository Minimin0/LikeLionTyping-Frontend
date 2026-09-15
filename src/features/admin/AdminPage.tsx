import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LogOut, Plus, Radio, Search, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError, errorMessage } from '../../shared/api/client'
import {
  adminLogin,
  findAdminParticipant,
  invalidateGame,
  issuePaidPass,
} from '../../shared/api/endpoints'
import type { AdminParticipant, GameStatus, PlayPass } from '../../shared/api/types'
import { Busy } from '../../shared/components'
import lpRed from './assets/images/LP_red.png'

// Radio-booth visual language (라디오/ON AIR 최종 디자인, 2026-09-13 확정) —
// scoped entirely to this file via Tailwind utilities, so it can't leak
// into the shared emerald-toned design the rest of the app uses. Form
// state, API calls, and error branching below are unchanged from the
// original implementation; only markup/classNames were replaced.
const panel =
  'admin-studio rounded-lg border border-[#ddd2bc] border-t-[3px] border-t-[#730c02] bg-[#fffdf8] p-6 shadow-sm sm:p-8'
const brandLine =
  "flex items-center gap-2 font-['Maru_Buri'] text-[11px] tracking-[0.12em] text-[#7a675c]"
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#730c02] px-4 py-2 font-['Maru_Buri'] font-semibold text-[#f4f5f0] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
const issueButton =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#730c02] px-4 py-2 font-['Maru_Buri'] text-sm font-semibold text-[#f4f5f0] shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
const invalidateButton =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#b5301f]/30 bg-[#b5301f]/5 px-3.5 py-1.5 font-['Maru_Buri'] text-sm font-semibold text-[#b5301f] transition hover:border-[#b5301f]/60 hover:bg-[#b5301f]/10 disabled:cursor-not-allowed disabled:opacity-50"
const fieldInput =
  'min-h-11 w-full rounded-lg border border-[#ddd2bc] bg-[#ece3d3] px-3 py-2 text-[#221f1d] outline-none transition focus:border-[#730c02]'

const STATUS_LABEL: Record<GameStatus | PlayPass['status'], string> = {
  AVAILABLE: '사용 가능',
  CONSUMED: '사용됨',
  CANCELLED: '취소됨',
  IN_PROGRESS: 'ON AIR',
  COMPLETED: '방송 완료',
  INVALIDATED: '무효 처리',
}

function formatElapsedMs(ms: number | null) {
  if (ms == null) return '기록 없음'
  return `${(ms / 1000).toFixed(3)}초`
}

const passwordSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
const phoneSchema = z.object({
  phone: z.string().trim().min(1, '전화번호를 입력해주세요.'),
})

export function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [participant, setParticipant] = useState<AdminParticipant | null>(null)
  const [notice, setNotice] = useState('')
  const loginForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })
  const searchForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
  })

  const authFailure = (error: unknown) => {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      setToken(null)
      setParticipant(null)
    }
  }
  const login = useMutation({
    mutationFn: ({ password }: z.infer<typeof passwordSchema>) =>
      adminLogin(password),
    onSuccess: ({ token: nextToken }) => {
      setToken(nextToken)
      loginForm.reset()
      setNotice('')
    },
  })
  const search = useMutation({
    mutationFn: ({ phone }: z.infer<typeof phoneSchema>) =>
      findAdminParticipant(token!, phone),
    onSuccess: setParticipant,
    onError: authFailure,
  })
  const issue = useMutation({
    mutationFn: () => issuePaidPass(token!, participant!.id),
    onSuccess: () => {
      setNotice('PAID 이용권을 확인했습니다.')
      search.mutate(searchForm.getValues())
    },
    onError: authFailure,
  })
  const invalidate = useMutation({
    mutationFn: (sessionId: number) => invalidateGame(token!, sessionId, true),
    onSuccess: () => {
      setNotice('경기를 무효화하고 이용권을 복구했습니다.')
      search.mutate(searchForm.getValues())
    },
    onError: authFailure,
  })

  if (!token)
    return (
      // 운영진 인증·조회 mutation은 그대로 두고 방송국 스타일 className만 더한다.
      <section className={`${panel} radio-admin-page`}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#730c02]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#730c02]">
          <span className="size-1.5 animate-pulse-air rounded-full bg-[#730c02]" />
          ON AIR · STAFF ONLY
        </span>
        <h1 className="font-['Maru_Buri'] text-2xl font-semibold text-[#221f1d]">
          운영진 로그인
        </h1>
        <p className="mt-1 text-sm text-[#7a675c]">
          멋쟁이 타자처럼 현장 운영 콘솔입니다. 관리자 비밀번호로 로그인하세요.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={loginForm.handleSubmit((values) => login.mutate(values))}
        >
          <label className="block text-sm font-bold text-[#221f1d]">
            관리자 비밀번호
            <input
              type="password"
              autoComplete="current-password"
              className={`${fieldInput} mt-2`}
              {...loginForm.register('password')}
            />
          </label>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-[#b5301f]">
              {loginForm.formState.errors.password.message}
            </p>
          )}
          {login.error && (
            <p role="alert" className="rounded-lg bg-[#b5301f]/10 px-4 py-3 text-sm font-medium text-[#b5301f]">
              {errorMessage(login.error)}
            </p>
          )}
          <button className={`${primaryButton} w-full`} disabled={login.isPending}>
            {login.isPending ? <Busy label="인증 중" /> : '로그인'}
          </button>
        </form>
      </section>
    )

  const actionError = issue.error ?? invalidate.error ?? search.error
  return (
    <section className={`${panel} radio-admin-page`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative size-9 shrink-0">
            <img
              src={lpRed}
              alt=""
              aria-hidden="true"
              className="absolute -left-3 -top-2.5 size-10 rotate-[-18deg]"
            />
            <div className="relative grid size-9 place-items-center rounded-lg bg-[#730c02] text-[#f4f5f0]">
              <Radio className="size-4" />
            </div>
          </div>
          <div>
            <div className={brandLine}>
              <span className="size-1.5 animate-pulse-air rounded-full bg-[#730c02]" />
              LIKELION TYPING <span aria-hidden="true">/</span> 운영진 콘솔
            </div>
            <h1 className="font-['Maru_Buri'] text-xl font-semibold text-[#221f1d]">
              참가자 관리
            </h1>
          </div>
        </div>
        <button
          className="rounded-lg p-2 text-[#7a675c] hover:bg-[#ece3d3]"
          title="로그아웃"
          onClick={() => {
            setToken(null)
            setParticipant(null)
          }}
        >
          <LogOut className="size-5" />
        </button>
      </div>
      <form
        className="flex gap-2"
        onSubmit={searchForm.handleSubmit((values) => {
          setNotice('')
          search.mutate(values)
        })}
      >
        <input
          className={fieldInput}
          inputMode="tel"
          placeholder="휴대전화 번호"
          {...searchForm.register('phone')}
        />
        <button className={primaryButton} disabled={search.isPending} title="검색">
          {search.isPending ? <Busy label="" /> : <Search className="size-5" />}
        </button>
      </form>
      {searchForm.formState.errors.phone && (
        <p className="mt-2 text-sm text-[#b5301f]">
          {searchForm.formState.errors.phone.message}
        </p>
      )}
      {Boolean(actionError) && (
        <div className="mt-4">
          <p role="alert" className="rounded-lg bg-[#b5301f]/10 px-4 py-3 text-sm font-medium text-[#b5301f]">
            {errorMessage(actionError)}
          </p>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-[#4c7a5e]/10 px-4 py-3 text-sm font-bold text-[#4c7a5e]"
        >
          {notice}
        </p>
      )}
      {participant && (
        <div className="mt-7 space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#ddd2bc] py-4">
            <div>
              <strong className="font-['Maru_Buri'] text-lg font-semibold text-[#221f1d]">
                {participant.nickname}
              </strong>
              <p className="text-sm text-[#7a675c]">
                {participant.phone} · 이용권{' '}
                {
                  participant.passes.filter((pass) => pass.status === 'AVAILABLE')
                    .length
                }
                장 사용 가능
              </p>
            </div>
            <button className={issueButton} disabled={issue.isPending} onClick={() => issue.mutate()}>
              {issue.isPending ? (
                <Busy label="발급 중" />
              ) : (
                <>
                  <Plus className="size-4" />
                  PAID 발급
                </>
              )}
            </button>
          </div>
          <div>
            <h2 className="mb-3 font-['Maru_Buri'] font-semibold text-[#221f1d]">
              경기 기록
            </h2>
            {participant.gameSessions.length === 0 ? (
              <p className="text-sm text-[#7a675c]">경기 기록이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {participant.gameSessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#ece3d3]/60 p-3"
                  >
                    <div>
                      <strong className="text-[#221f1d]">
                        #{session.id} · {STATUS_LABEL[session.status]}
                      </strong>
                      <p className="text-xs text-[#7a675c]">
                        카테고리 {session.categoryId} · {formatElapsedMs(session.elapsedMs)}
                      </p>
                    </div>
                    {session.status !== 'INVALIDATED' && (
                      <button
                        className={invalidateButton}
                        disabled={invalidate.isPending}
                        onClick={() => invalidate.mutate(session.id)}
                      >
                        {invalidate.isPending && invalidate.variables === session.id ? (
                          <Busy label="복구 중" />
                        ) : (
                          <>
                            <Undo2 className="size-4" />
                            무효화 + 복구
                          </>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

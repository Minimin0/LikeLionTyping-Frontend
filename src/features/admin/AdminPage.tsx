import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LogOut, Plus, Search, Shield, Undo2 } from 'lucide-react'
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
import type { AdminParticipant } from '../../shared/api/types'
import {
  Alert,
  Busy,
  buttonClass,
  inputClass,
  panelClass,
  secondaryButtonClass,
} from '../../shared/components'

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
      <section className={panelClass}>
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-zinc-900 text-white">
            <Shield />
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-700">운영 전용</p>
            <h1 className="text-2xl font-black">관리자 로그인</h1>
          </div>
        </div>
        <form
          className="space-y-4"
          onSubmit={loginForm.handleSubmit((values) => login.mutate(values))}
        >
          <label className="block font-bold">
            비밀번호
            <input
              type="password"
              autoComplete="current-password"
              className={`${inputClass} mt-2`}
              {...loginForm.register('password')}
            />
          </label>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-red-700">
              {loginForm.formState.errors.password.message}
            </p>
          )}
          {login.error && <Alert>{errorMessage(login.error)}</Alert>}
          <button
            className={`${buttonClass} w-full`}
            disabled={login.isPending}
          >
            {login.isPending ? <Busy label="인증 중" /> : '로그인'}
          </button>
        </form>
      </section>
    )

  const actionError = issue.error ?? invalidate.error ?? search.error
  return (
    <section className={panelClass}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">운영 전용</p>
          <h1 className="text-2xl font-black">참가자 관리</h1>
        </div>
        <button
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
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
          className={inputClass}
          inputMode="tel"
          placeholder="휴대전화 번호"
          {...searchForm.register('phone')}
        />
        <button
          className={buttonClass}
          disabled={search.isPending}
          title="검색"
        >
          {search.isPending ? <Busy label="" /> : <Search className="size-5" />}
        </button>
      </form>
      {searchForm.formState.errors.phone && (
        <p className="mt-2 text-sm text-red-700">
          {searchForm.formState.errors.phone.message}
        </p>
      )}
      {Boolean(actionError) && (
        <div className="mt-4">
          <Alert>{errorMessage(actionError)}</Alert>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
        >
          {notice}
        </p>
      )}
      {participant && (
        <div className="mt-7 space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-200 py-4">
            <div>
              <strong className="text-lg">{participant.nickname}</strong>
              <p className="text-sm text-zinc-500">
                이용권{' '}
                {
                  participant.passes.filter(
                    (pass) => pass.status === 'AVAILABLE',
                  ).length
                }
                장 사용 가능
              </p>
            </div>
            <button
              className={secondaryButtonClass}
              disabled={issue.isPending}
              onClick={() => issue.mutate()}
            >
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
            <h2 className="mb-3 font-black">경기 기록</h2>
            {participant.gameSessions.length === 0 ? (
              <p className="text-sm text-zinc-500">경기 기록이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {participant.gameSessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 p-3"
                  >
                    <div>
                      <strong>
                        #{session.id} · {session.status}
                      </strong>
                      <p className="text-xs text-zinc-500">
                        Category {session.categoryId} ·{' '}
                        {session.elapsedMs
                          ? `${session.elapsedMs}ms`
                          : '기록 없음'}
                      </p>
                    </div>
                    {session.status !== 'INVALIDATED' && (
                      <button
                        className={secondaryButtonClass}
                        disabled={invalidate.isPending}
                        onClick={() => invalidate.mutate(session.id)}
                      >
                        {invalidate.isPending &&
                        invalidate.variables === session.id ? (
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

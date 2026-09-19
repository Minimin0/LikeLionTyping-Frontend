import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LogOut, Minus, Plus, Radio, Search, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { ApiError, errorMessage } from '../../shared/api/client'
import {
  adminLogin,
  getAdminDashboard,
  invalidateGame,
  issuePaidPass,
  searchAdminParticipants,
} from '../../shared/api/endpoints'
import type { AdminParticipant, AdminParticipantSearchResult, GameStatus, PlayPass } from '../../shared/api/types'
import { Busy } from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'
import { useAdminAuth } from './AdminAuth'
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
const formatKrw = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

const passwordSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
const searchSchema = z.object({
  query: z.string().trim().min(1, '전화번호 또는 닉네임을 입력해주세요.'),
})

export function AdminPage() {
  const { token, setToken } = useAdminAuth()
  const [participant, setParticipant] = useState<AdminParticipant | null>(null)
  const [results, setResults] = useState<AdminParticipantSearchResult[]>([])
  const [quantity, setQuantity] = useState(1)
  const [invalidateDraft, setInvalidateDraft] = useState({
    sessionId: 0,
    reason: '',
    restorePass: true,
  })
  const [notice, setNotice] = useState('')
  const loginForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
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
  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => getAdminDashboard(token!),
    enabled: Boolean(token),
  })
  const search = useMutation({
    mutationFn: ({ query }: z.infer<typeof searchSchema>) =>
      searchAdminParticipants(token!, query),
    onSuccess: (matches) => {
      setResults(matches)
      setParticipant(matches.length === 1 ? matches[0] : null)
    },
    onError: authFailure,
  })
  const issue = useMutation({
    mutationFn: () => issuePaidPass(token!, participant!.id, quantity),
    onSuccess: (result) => {
      setNotice(`PAID ${result.quantity}회 · ${formatKrw(result.amountKrw)} 결제를 기록했습니다.`)
      search.mutate({ query: participant!.phone })
      dashboard.refetch()
    },
    onError: authFailure,
  })
  const invalidate = useMutation({
    mutationFn: () => invalidateGame(
      token!,
      invalidateDraft.sessionId,
      invalidateDraft.restorePass,
      invalidateDraft.reason,
    ),
    onSuccess: () => {
      setNotice(invalidateDraft.restorePass ? '경기를 무효화하고 이용권을 복구했습니다.' : '경기를 무효화했습니다.')
      search.mutate({ query: participant!.phone })
      dashboard.refetch()
      setInvalidateDraft({ sessionId: 0, reason: '', restorePass: true })
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
            setResults([])
            setInvalidateDraft({ sessionId: 0, reason: '', restorePass: true })
          }}
        >
          <LogOut className="size-5" />
        </button>
      </div>
      {dashboard.data && (
        <div className="mb-6 space-y-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <Metric
              label="참가자"
              value={dashboard.data.totalParticipants}
              to={ROUTES.ADMIN_PARTICIPANTS}
            />
            <Metric label="총 플레이" value={dashboard.data.totalPlayCount} />
            <Metric
              label="결제 합계"
              value={formatKrw(dashboard.data.totalPaymentAmountKrw)}
              to={ROUTES.ADMIN_PAYMENTS}
            />
            <Metric label="남은 PAID" value={dashboard.data.availablePaidPassCount} />
            <Metric label="FREE 플레이" value={dashboard.data.freePlayCount} />
            <Metric label="PAID 플레이" value={dashboard.data.paidPlayCount} />
            <Metric label="완료 경기" value={dashboard.data.completedGameCount} />
            <Metric label="무효 경기" value={dashboard.data.invalidatedGameCount} />
          </div>
          <div className="rounded-lg bg-[#ece3d3]/60 p-4">
            <p className="mb-3 font-['Maru_Buri'] font-semibold text-[#221f1d]">채널별 플레이</p>
            {[
              ['CH01', dashboard.data.ch01PlayCount],
              ['CH02', dashboard.data.ch02PlayCount],
              ['CH03', dashboard.data.ch03PlayCount],
            ].map(([code, count]) => {
              const max = Math.max(dashboard.data.ch01PlayCount, dashboard.data.ch02PlayCount, dashboard.data.ch03PlayCount, 1)
              return (
                <div key={code} className="mb-2 grid grid-cols-[52px_1fr_42px] items-center gap-2 text-sm">
                  <span>{code}</span>
                  <span className="h-2 rounded-full bg-[#ddd2bc]">
                    <span className="block h-2 rounded-full bg-[#730c02]" style={{ width: `${(Number(count) / max) * 100}%` }} />
                  </span>
                  <span className="text-right tabular">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={searchForm.handleSubmit((values) => {
          setNotice('')
          setParticipant(null)
          setResults([])
          search.mutate(values)
        })}
      >
        <input
          className={fieldInput}
          placeholder="전화번호 또는 닉네임"
          {...searchForm.register('query')}
        />
        <button className={primaryButton} disabled={search.isPending} title="검색">
          {search.isPending ? <Busy label="" /> : <Search className="size-5" />}
        </button>
      </form>
      {searchForm.formState.errors.query && (
        <p className="mt-2 text-sm text-[#b5301f]">
          {searchForm.formState.errors.query.message}
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
      {search.isSuccess && results.length === 0 && (
        <p className="mt-5 rounded-lg bg-[#ece3d3]/70 px-4 py-3 text-sm font-medium text-[#7a675c]">
          검색 결과가 없습니다.
        </p>
      )}
      {results.length > 1 && !participant && (
        <div className="mt-5 space-y-2">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-lg bg-[#ece3d3]/60 p-3 text-left transition hover:bg-[#ece3d3]"
              onClick={() => setParticipant(result)}
            >
              <span className="font-['Maru_Buri'] font-semibold text-[#221f1d]">
                {result.nickname}
              </span>
              <span className="text-sm text-[#7a675c]">
                {result.phone} · 이용권{' '}
                {result.passes.filter((pass) => pass.status === 'AVAILABLE').length}
                장
              </span>
            </button>
          ))}
        </div>
      )}
      {participant && (
        <div className="mt-7 space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#ddd2bc] py-4">
            <div>
              <strong className="font-['Maru_Buri'] text-lg font-semibold text-[#221f1d]">
                {participant.nickname}
              </strong>
              <p className="text-sm text-[#7a675c]">
                {participant.phone} · 이용권 {participant.summary.availablePassCount}장 사용 가능 · PAID {participant.summary.availablePaidPassCount}장
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className={invalidateButton} type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="발급 수량 감소">
                <Minus className="size-4" />
              </button>
              <span className="min-w-20 text-center font-['Maru_Buri'] font-semibold">{quantity}회</span>
              <button className={invalidateButton} type="button" onClick={() => setQuantity(quantity + 1)} aria-label="발급 수량 증가">
                <Plus className="size-4" />
              </button>
              <span className="text-sm font-bold text-[#730c02]">{formatKrw(quantity * 500)}</span>
              <button className={issueButton} disabled={issue.isPending} onClick={() => issue.mutate()}>
                {issue.isPending ? <Busy label="발급 중" /> : 'PAID 발급'}
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Metric label="FREE 사용" value={participant.summary.freeParticipationUsed ? '사용됨' : '가능'} />
            <Metric label="총 경기" value={participant.summary.totalPlayCount} />
            <Metric label="완료 / 무효" value={`${participant.summary.completedGameCount} / ${participant.summary.invalidatedGameCount}`} />
            <Metric label="결제 합계" value={formatKrw(participant.summary.totalPaymentAmountKrw)} />
            {participant.summary.bestRecords.map((record) => (
              <Metric key={record.categoryCode} label={`${record.categoryCode} 최고`} value={formatElapsedMs(record.elapsedMs)} />
            ))}
          </div>
          <div>
            <h2 className="mb-3 font-['Maru_Buri'] font-semibold text-[#221f1d]">
              결제 기록
            </h2>
            {participant.payments.length === 0 ? (
              <p className="text-sm text-[#7a675c]">결제 기록이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {participant.payments.map((payment) => (
                  <li key={payment.id} className="rounded-lg bg-[#ece3d3]/60 p-3 text-sm text-[#5f5651]">
                    {new Date(payment.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · {participant.nickname} · {formatKrw(payment.amountKrw)} 결제 · PAID +{payment.quantity}회
                  </li>
                ))}
              </ul>
            )}
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
                      <div className="w-full space-y-2 sm:w-auto">
                        {invalidateDraft.sessionId !== session.id ? (
                          <button
                            className={invalidateButton}
                            disabled={invalidate.isPending}
                            onClick={() => setInvalidateDraft({ sessionId: session.id, reason: '', restorePass: true })}
                          >
                            <Undo2 className="size-4" />
                            무효 처리
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              className={fieldInput}
                              placeholder="무효 처리 사유"
                              value={invalidateDraft.reason}
                              onChange={(event) => setInvalidateDraft({ ...invalidateDraft, reason: event.target.value })}
                            />
                            <label className="flex items-center gap-2 text-sm text-[#5f5651]">
                              <input
                                type="checkbox"
                                checked={invalidateDraft.restorePass}
                                onChange={(event) => setInvalidateDraft({ ...invalidateDraft, restorePass: event.target.checked })}
                              />
                              이용권 복구
                            </label>
                            <button className={invalidateButton} disabled={invalidate.isPending} onClick={() => invalidate.mutate()}>
                              {invalidate.isPending ? <Busy label="처리 중" /> : '무효 처리 확정'}
                            </button>
                          </div>
                        )}
                      </div>
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

function Metric({ label, value, to }: { label: string; value: number | string; to?: string }) {
  const className = "block rounded-lg bg-[#ece3d3]/60 p-3 transition hover:bg-[#ece3d3] focus:outline-none focus:ring-2 focus:ring-[#730c02]/40"
  const content = (
    <>
      <p className="text-xs font-bold text-[#7a675c]">{label}</p>
      <p className="mt-1 font-['Maru_Buri'] text-lg font-semibold text-[#221f1d] tabular">{value}</p>
    </>
  )
  if (to) return <Link className={className} to={to}>{content}</Link>
  return <div className="rounded-lg bg-[#ece3d3]/60 p-3">{content}</div>
}

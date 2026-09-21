import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, errorMessage } from '../../shared/api/client'
import { getAdminParticipantHistory } from '../../shared/api/endpoints'
import { Busy } from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'
import { useAdminAuth } from './AdminAuth'

const panel =
  'admin-studio rounded-lg border border-[#ddd2bc] border-t-[3px] border-t-[#730c02] bg-[#fffdf8] p-4 shadow-sm sm:p-8'
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#730c02] px-4 py-2 font-['Maru_Buri'] font-semibold text-[#f4f5f0] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
const quietLink =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 font-['Maru_Buri'] text-sm font-semibold text-[#730c02] transition hover:bg-[#ece3d3] focus:outline-none focus:ring-2 focus:ring-[#730c02]/40"

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 11) return phone
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function AdminParticipantsPage() {
  const { token, setToken } = useAdminAuth()
  const participants = useQuery({
    queryKey: ['admin', 'participants', 'all'],
    queryFn: () => getAdminParticipantHistory(token!),
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (
      participants.error instanceof ApiError &&
      [401, 403].includes(participants.error.status)
    )
      setToken(null)
  }, [participants.error, setToken])

  if (!token)
    return (
      <section className={`${panel} radio-admin-page`}>
        <h1 className="font-['Maru_Buri'] text-2xl font-semibold text-[#221f1d]">
          운영진 로그인이 필요합니다
        </h1>
        <p className="mt-2 text-sm text-[#7a675c]">
          참가자 현황은 운영자 인증 후 확인할 수 있습니다.
        </p>
        <Link className={`${primaryButton} mt-6`} to={ROUTES.ADMIN}>
          운영자 콘솔로 이동
        </Link>
      </section>
    )

  const data = participants.data

  return (
    <section className={`${panel} radio-admin-page`}>
      <Link className={quietLink} to={ROUTES.ADMIN}>
        <ArrowLeft className="size-4" />
        운영자 콘솔
      </Link>
      <div className="mt-5 grid gap-3 md:flex md:flex-wrap md:items-end md:justify-between">
        <div>
          <h1 className="font-['Maru_Buri'] text-2xl font-semibold text-[#221f1d]">
            참가자 현황
          </h1>
          <p className="mt-1 text-sm text-[#7a675c]">
            행사에 등록한 전체 참가자를 확인합니다.
          </p>
        </div>
        <button
          className={`${primaryButton} w-full md:w-auto`}
          type="button"
          onClick={() => participants.refetch()}
          disabled={participants.isFetching}
        >
          {participants.isFetching ? (
            <Busy label="새로고침 중" />
          ) : (
            <>
              <RefreshCw className="size-4" />
              새로고침
            </>
          )}
        </button>
      </div>

      {participants.isLoading && <Busy label="참가자 현황을 불러오는 중" />}
      {participants.error &&
        !(
          participants.error instanceof ApiError &&
          [401, 403].includes(participants.error.status)
        ) && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-[#b5301f]/10 px-4 py-3 text-sm font-medium text-[#b5301f]"
          >
            {errorMessage(participants.error) ||
              '참가자 현황을 불러오지 못했습니다.'}
          </p>
        )}

      {data && (
        <div className="mt-7 space-y-7">
          <div className="rounded-lg bg-[#ece3d3]/60 p-4">
            <p className="text-xs font-bold text-[#7a675c]">총 참가자</p>
            <p className="mt-2 font-['Maru_Buri'] text-xl font-semibold text-[#221f1d] tabular">
              {data.totalParticipants.toLocaleString('ko-KR')}명
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-['Maru_Buri'] font-semibold text-[#221f1d]">
              참가자 목록
            </h2>
            {data.participants.length === 0 ? (
              <p className="rounded-lg bg-[#ece3d3]/60 p-4 text-sm text-[#7a675c]">
                아직 등록된 참가자가 없습니다.
              </p>
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-lg border border-[#ddd2bc] md:block">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="bg-[#ece3d3]/80 font-['Maru_Buri'] text-[#221f1d]">
                      <tr>
                        <th className="px-4 py-3">참가 시간</th>
                        <th className="px-4 py-3">닉네임</th>
                        <th className="px-4 py-3">전화번호</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.participants.map((participant) => (
                        <tr
                          key={participant.id}
                          className="border-t border-[#ddd2bc]"
                        >
                          <td className="px-4 py-3 tabular">
                            {formatTime(participant.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#221f1d]">
                            {participant.nickname}
                          </td>
                          <td className="px-4 py-3 tabular">
                            {formatPhone(participant.phone)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="space-y-2 md:hidden">
                  {data.participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="rounded-lg bg-[#ece3d3]/60 p-4"
                    >
                      <p className="font-['Maru_Buri'] font-semibold text-[#221f1d]">
                        {participant.nickname}
                      </p>
                      <p className="mt-1 select-text text-sm text-[#5f5651] tabular">
                        {formatPhone(participant.phone)}
                      </p>
                      <p className="mt-2 text-sm text-[#7a675c]">
                        참가 {formatTime(participant.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

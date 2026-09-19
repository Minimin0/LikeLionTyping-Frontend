import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, errorMessage } from '../../shared/api/client'
import { getAdminPayments } from '../../shared/api/endpoints'
import { Busy } from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'
import { useAdminAuth } from './AdminAuth'

const panel =
  'admin-studio rounded-lg border border-[#ddd2bc] border-t-[3px] border-t-[#730c02] bg-[#fffdf8] p-6 shadow-sm sm:p-8'
const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#730c02] px-4 py-2 font-['Maru_Buri'] font-semibold text-[#f4f5f0] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
const quietLink =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 font-['Maru_Buri'] text-sm font-semibold text-[#730c02] transition hover:bg-[#ece3d3] focus:outline-none focus:ring-2 focus:ring-[#730c02]/40"

const formatKrw = (amount: number) => `${amount.toLocaleString('ko-KR')}원`
const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 11) return phone
  return `${digits.slice(0, 3)}-****-${digits.slice(7)}`
}

export function AdminPaymentsPage() {
  const { token, setToken } = useAdminAuth()
  const payments = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => getAdminPayments(token!),
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (
      payments.error instanceof ApiError &&
      [401, 403].includes(payments.error.status)
    )
      setToken(null)
  }, [payments.error, setToken])

  if (!token)
    return (
      <section className={`${panel} radio-admin-page`}>
        <h1 className="font-['Maru_Buri'] text-2xl font-semibold text-[#221f1d]">
          운영진 로그인이 필요합니다
        </h1>
        <p className="mt-2 text-sm text-[#7a675c]">
          결제 현황은 운영자 인증 후 확인할 수 있습니다.
        </p>
        <Link className={`${primaryButton} mt-6`} to={ROUTES.ADMIN}>
          운영자 콘솔로 이동
        </Link>
      </section>
    )

  const data = payments.data

  return (
    <section className={`${panel} radio-admin-page`}>
      <Link className={quietLink} to={ROUTES.ADMIN}>
        <ArrowLeft className="size-4" />
        운영자 콘솔
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-['Maru_Buri'] text-2xl font-semibold text-[#221f1d]">
            결제 현황
          </h1>
          <p className="mt-1 text-sm text-[#7a675c]">
            행사 전체 PAID 이용권 발급과 결제 기록을 확인합니다.
          </p>
        </div>
        <button
          className={primaryButton}
          type="button"
          onClick={() => payments.refetch()}
          disabled={payments.isFetching}
        >
          {payments.isFetching ? <Busy label="새로고침 중" /> : <><RefreshCw className="size-4" />새로고침</>}
        </button>
      </div>

      {payments.isLoading && <Busy label="결제 현황을 불러오는 중" />}
      {payments.error && !(payments.error instanceof ApiError && [401, 403].includes(payments.error.status)) && (
        <p role="alert" className="mt-6 rounded-lg bg-[#b5301f]/10 px-4 py-3 text-sm font-medium text-[#b5301f]">
          {errorMessage(payments.error) || '결제 현황을 불러오지 못했습니다.'}
        </p>
      )}

      {data && (
        <div className="mt-7 space-y-7">
          <div className="grid gap-2 sm:grid-cols-3">
            <Summary label="총 결제액" value={formatKrw(data.totalPaymentAmountKrw)} />
            <Summary label="결제 건수" value={`${data.totalPaymentCount.toLocaleString('ko-KR')}건`} />
            <Summary label="판매 이용권" value={`${data.totalPaidPassQuantity.toLocaleString('ko-KR')}회`} />
          </div>

          <div>
            <h2 className="mb-3 font-['Maru_Buri'] font-semibold text-[#221f1d]">
              결제 내역
            </h2>
            {data.payments.length === 0 ? (
              <p className="rounded-lg bg-[#ece3d3]/60 p-4 text-sm text-[#7a675c]">
                아직 등록된 결제 기록이 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#ddd2bc]">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-[#ece3d3]/80 font-['Maru_Buri'] text-[#221f1d]">
                    <tr>
                      <th className="px-4 py-3">결제 시간</th>
                      <th className="px-4 py-3">참가자</th>
                      <th className="px-4 py-3">전화번호</th>
                      <th className="px-4 py-3">결제 금액</th>
                      <th className="px-4 py-3">PAID 발급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id} className="border-t border-[#ddd2bc]">
                        <td className="px-4 py-3 tabular">{formatTime(payment.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-[#221f1d]">{payment.nickname}</td>
                        <td className="px-4 py-3 tabular">{maskPhone(payment.phone)}</td>
                        <td className="px-4 py-3 tabular">{formatKrw(payment.amountKrw)}</td>
                        <td className="px-4 py-3 tabular">+{payment.quantity}회</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#ece3d3]/60 p-4">
      <p className="text-xs font-bold text-[#7a675c]">{label}</p>
      <p className="mt-2 font-['Maru_Buri'] text-xl font-semibold text-[#221f1d] tabular">
        {value}
      </p>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { RotateCcw, Trophy } from 'lucide-react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../shared/api/client'
import { getGame } from '../../shared/api/endpoints'
import type { GameResult } from '../../shared/api/types'
import {
  Alert,
  Busy,
  buttonClass,
  panelClass,
  secondaryButtonClass,
} from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'

const seconds = (milliseconds: number | null) =>
  milliseconds == null ? '-' : `${(milliseconds / 1_000).toFixed(3)}초`

export function ResultPage() {
  const { gameSessionId } = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const id = Number(gameSessionId)
  const result = useQuery({
    queryKey: ['game-session', id],
    queryFn: () => getGame(id),
    initialData: location.state as GameResult | undefined,
    enabled: Number.isInteger(id),
  })

  return (
    <section className={panelClass}>
      {result.isLoading && (
        <div className="flex justify-center py-12">
          <Busy label="결과 확인 중" />
        </div>
      )}
      {result.error && <Alert>{errorMessage(result.error)}</Alert>}
      {result.data?.status === 'COMPLETED' && (
        <>
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-lg bg-yellow-300">
              <Trophy aria-hidden />
            </span>
            <h1 className="mt-4 text-2xl font-black">경기 완료</h1>
            {result.data.personalBest && (
              <p className="mt-2 font-bold text-emerald-700">
                새로운 개인 최고 기록입니다.
              </p>
            )}
          </div>
          <dl className="my-8 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-200 py-5 text-center">
            <div>
              <dt className="text-xs text-zinc-500">기록</dt>
              <dd className="mt-1 font-black">
                {seconds(result.data.elapsedMs)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">개인 최고</dt>
              <dd className="mt-1 font-black">
                {seconds(result.data.personalBestMs)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">현재 순위</dt>
              <dd className="mt-1 font-black">{result.data.rank ?? '-'}위</dd>
            </div>
          </dl>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className={buttonClass}
              to={`${ROUTES.RANKINGS}?categoryId=${search.get('categoryId') ?? ''}`}
            >
              랭킹 보기
            </Link>
            <Link className={secondaryButtonClass} to={ROUTES.LANDING}>
              <RotateCcw className="size-4" />
              다시 참가하기
            </Link>
          </div>
        </>
      )}
      {result.data?.status === 'IN_PROGRESS' && (
        <Alert>아직 완료되지 않은 경기입니다.</Alert>
      )}
      {result.data?.status === 'INVALIDATED' && (
        <Alert>운영진이 무효 처리한 경기입니다.</Alert>
      )}
    </section>
  )
}

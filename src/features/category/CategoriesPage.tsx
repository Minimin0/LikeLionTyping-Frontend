import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Radio } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../../app/session'
import { errorMessage } from '../../shared/api/client'
import { getCategories } from '../../shared/api/endpoints'
import { Alert, Busy, buttonClass, panelClass } from '../../shared/components'

export function CategoriesPage() {
  const navigate = useNavigate()
  const { participant } = useSession()
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  if (!participant) return <Navigate to="/" replace />

  return (
    <section className={panelClass}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            {participant.nickname} 님
          </p>
          <h1 className="mt-1 text-2xl font-black">카테고리 선택</h1>
        </div>
        <span className="rounded-lg bg-yellow-100 px-3 py-2 text-sm font-bold">
          이용권 {participant.availablePassCount}장
        </span>
      </div>
      {categories.isLoading && (
        <div className="flex justify-center py-12">
          <Busy label="불러오는 중" />
        </div>
      )}
      {categories.error && <Alert>{errorMessage(categories.error)}</Alert>}
      <div className="grid gap-3 sm:grid-cols-3">
        {categories.data?.map((category) => (
          <button
            key={category.id}
            className="group flex min-h-36 flex-col items-start justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate(`/game/${category.id}`)}
          >
            <Radio className="size-5 text-emerald-700" aria-hidden />
            <span>
              <strong className="block text-lg">{category.name}</strong>
              <span className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                {category.code}
                <ArrowRight className="size-3 transition group-hover:translate-x-1" />
              </span>
            </span>
          </button>
        ))}
      </div>
      {!categories.isLoading && categories.data?.length === 0 && (
        <p className="py-10 text-center text-zinc-500">
          준비된 카테고리가 없습니다.
        </p>
      )}
      <button
        className={`${buttonClass} mt-7 w-full`}
        onClick={() => navigate('/rankings')}
      >
        랭킹 보기
      </button>
    </section>
  )
}

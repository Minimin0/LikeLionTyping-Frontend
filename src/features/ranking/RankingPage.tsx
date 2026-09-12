import { useQuery } from '@tanstack/react-query'
import { Medal } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../shared/api/client'
import { getCategories, getRankings } from '../../shared/api/endpoints'
import {
  Alert,
  Busy,
  Empty,
  inputClass,
  panelClass,
} from '../../shared/components'

export function RankingPage() {
  const [search] = useSearchParams()
  const [categoryId, setCategoryId] = useState(
    Number(search.get('categoryId')) || 0,
  )
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const selectedCategoryId = categoryId || categories.data?.[0]?.id || 0
  const ranking = useQuery({
    queryKey: ['ranking', selectedCategoryId],
    queryFn: () => getRankings(selectedCategoryId),
    enabled: selectedCategoryId > 0,
  })

  return (
    <section className={panelClass}>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg bg-yellow-300">
          <Medal />
        </span>
        <div>
          <p className="text-sm font-bold text-emerald-700">공식 기록</p>
          <h1 className="text-2xl font-black">카테고리 랭킹</h1>
        </div>
      </div>
      <label className="block text-sm font-bold">
        카테고리
        <select
          className={`${inputClass} mt-2`}
          value={selectedCategoryId}
          onChange={(event) => setCategoryId(Number(event.target.value))}
        >
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.code})
            </option>
          ))}
        </select>
      </label>
      {ranking.isLoading && (
        <div className="flex justify-center py-12">
          <Busy label="랭킹 확인 중" />
        </div>
      )}
      {(ranking.error || categories.error) && (
        <div className="mt-5">
          <Alert>{errorMessage(ranking.error ?? categories.error)}</Alert>
        </div>
      )}
      {ranking.data && ranking.data.length === 0 && (
        <div className="mt-6">
          <Empty>아직 등록된 기록이 없습니다.</Empty>
        </div>
      )}
      {ranking.data && ranking.data.length > 0 && (
        <ol className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200">
          {ranking.data.map((entry) => (
            <li
              key={`${entry.rank}-${entry.nickname}`}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 py-4"
            >
              <strong className="text-center text-lg">{entry.rank}</strong>
              <span className="truncate font-bold">{entry.nickname}</span>
              <span className="font-mono text-sm">
                {(entry.elapsedMs / 1_000).toFixed(3)}초
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

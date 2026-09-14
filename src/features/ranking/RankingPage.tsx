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
  // 응답이 배열이 아닐 수 있다. 그대로 map을 돌리면 화면 전체가 죽는다.
  const categoryRows = Array.isArray(categories.data) ? categories.data : []
  const selectedCategoryId = categoryId || categoryRows[0]?.id || 0
  const ranking = useQuery({
    queryKey: ['ranking', selectedCategoryId],
    queryFn: () => getRankings(selectedCategoryId),
    enabled: selectedCategoryId > 0,
  })
  const rankingRows = Array.isArray(ranking.data) ? ranking.data : []
  // 조회가 끝났고 에러도 없는데 결과가 비었을 때만 "기록 없음"이다. 로딩 중에 뜨면 안 된다.
  const isRankingEmpty =
    ranking.data !== undefined &&
    !ranking.isLoading &&
    !ranking.error &&
    rankingRows.length === 0

  return (
    // 데이터 조회와 select 상태는 유지하고, 디자인 훅만 추가한다.
    <section className={`${panelClass} radio-ranking-page`}>
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
          {categoryRows.map((category) => (
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
      {isRankingEmpty && (
        <div className="mt-6">
          <Empty>아직 기록이 없습니다</Empty>
        </div>
      )}
      {rankingRows.length > 0 && (
        <ol className="radio-ranking-list mt-6">
          {rankingRows.map((entry) => (
            <li
              key={`${entry.rank}-${entry.nickname}`}
              className="radio-ranking-row grid grid-cols-[3rem_1fr_auto] items-center gap-3 py-4"
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

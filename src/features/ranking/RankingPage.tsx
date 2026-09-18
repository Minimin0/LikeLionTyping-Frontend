import { useQuery } from '@tanstack/react-query'
import { Medal } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../shared/api/client'
import { getCategories, getRankings } from '../../shared/api/endpoints'
import { Alert, Busy, Empty } from '../../shared/components'
import { displayCategoryName } from '../../shared/utils/categoryDisplay'
import rankingAirmail from '../../shared/brand/images/ranking-airmail.png'
import cassetteRed from '../../shared/brand/images/cassette-red.png'
import cassetteOlive from '../../shared/brand/images/cassette-olive.png'
import cassetteOrange from '../../shared/brand/images/cassette-orange.png'

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
    // 조회 상태는 유지하고, 카테고리 선택만 select에서 탭으로 바꾼다.
    <section className="ranking-studio-stage">
      <div className="ranking-cassette-background" aria-hidden>
        <img className="ranking-cassette-red" src={cassetteRed} alt="" />
        <img className="ranking-cassette-olive" src={cassetteOlive} alt="" />
        <img className="ranking-cassette-orange" src={cassetteOrange} alt="" />
      </div>
      <div className="ranking-studio-heading">
        <span className="ranking-studio-medal"><Medal aria-hidden /></span>
        <div>
          <p>OFFICIAL RECORDS</p>
          <h1>카테고리 랭킹</h1>
        </div>
      </div>
      <div className="ranking-category-tabs" role="tablist" aria-label="카테고리 선택">
        {categoryRows.map((category) => {
          const active = category.id === selectedCategoryId
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`ranking-category-tab ${active ? 'is-active' : ''}`}
              onClick={() => setCategoryId(category.id)}
            >
              <small>{category.code}</small>
              <span>{displayCategoryName(category)}</span>
            </button>
          )
        })}
      </div>
      {ranking.isLoading && (
        <div className="ranking-studio-feedback">
          <Busy label="랭킹 확인 중" />
        </div>
      )}
      {(ranking.error || categories.error) && (
        <div className="ranking-studio-feedback">
          <Alert>{errorMessage(ranking.error ?? categories.error)}</Alert>
        </div>
      )}
      {isRankingEmpty && (
        <div className="ranking-studio-feedback">
          <Empty>아직 기록이 없습니다</Empty>
        </div>
      )}
      {rankingRows.length > 0 && (
        <div className="ranking-airmail-board">
          <img src={rankingAirmail} alt="" aria-hidden />
          <ol className="ranking-airmail-list">
            {rankingRows.map((entry) => (
              <li key={`${entry.rank}-${entry.nickname}`}>
                <strong>{entry.rank}</strong>
                <span className="ranking-nickname">{entry.nickname}</span>
                <span className="ranking-time">
                  {(entry.elapsedMs / 1_000).toFixed(3)}초
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

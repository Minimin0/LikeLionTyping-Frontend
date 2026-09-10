import { useEffect, useState } from 'react'
import { getAdminRankings, getCategories } from '../api/adminApi'
import { formatPhone, formatTypingSpeed } from '../../../shared/utils/format'

// Admin-only ranking view. Deliberately calls getAdminRankings() (not the
// public getRankings()) because staff need the phone number on screen to
// verify identity before handing out a prize — the public/participant
// ranking screen must never show it.
function RankingPanel() {
  const [categories, setCategories] = useState([])
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [rankings, setRankings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load the channel list once, then default to the first channel.
  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data)
      setActiveCategoryId(data[0]?.id ?? null)
    })
  }, [])

  // Re-fetch whenever the selected channel tab changes.
  useEffect(() => {
    if (activeCategoryId == null) return
    setIsLoading(true)
    getAdminRankings(activeCategoryId).then((data) => {
      setRankings(data)
      setIsLoading(false)
    })
  }, [activeCategoryId])

  return (
    <div className="admin-panel">
      <h2 className="admin-panel__title">랭킹 확인</h2>
      <p className="admin-panel__hint">
        채널별 현재 순위 · 최종 수상은 접수 마감 후 확정됩니다. (운영진 전용 화면이므로 상품 지급 본인 확인을 위해
        전화번호를 함께 표시합니다.)
      </p>

      <div className="channel-tabs">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`channel-tab ${category.id === activeCategoryId ? 'channel-tab--active' : ''}`}
            onClick={() => setActiveCategoryId(category.id)}
          >
            <span className="channel-tab__code">{category.code}</span>
            {category.name}
          </button>
        ))}
      </div>

      {isLoading && <p className="empty-state">불러오는 중…</p>}

      {!isLoading && rankings.length === 0 && <p className="empty-state">아직 완료된 기록이 없습니다.</p>}

      {!isLoading && rankings.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>전화번호</th>
              <th>기록</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry) => (
              <tr key={entry.rank} className={entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : ''}>
                <td data-label="순위" className="rank-cell">{entry.rank}</td>
                <td data-label="닉네임">{entry.nickname}</td>
                <td data-label="전화번호">{formatPhone(entry.phone)}</td>
                <td data-label="기록">{formatTypingSpeed(entry.typingSpeed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default RankingPanel

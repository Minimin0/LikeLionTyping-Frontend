// 순위와 최고 기록은 서버가 결정한다. 프론트에서는 재계산하거나 재정렬하지 않는다.
import { apiClient } from '@/shared/api/apiClient'
import type { RankingEntry } from '../types/ranking.types'
export async function fetchRanking(categoryId: number): Promise<RankingEntry[]> {
  const { data } = await apiClient.get<RankingEntry[]>('/rankings', { params: { categoryId } })
  return data.map(({ rank, nickname, elapsedMs }) => ({ rank, nickname, elapsedMs }))
}

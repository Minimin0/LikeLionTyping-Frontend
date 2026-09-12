// 팀 공통 Query Key를 사용해 채널별 랭킹을 독립적으로 관리한다.
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/shared/api/categoryApi'
import { fetchRanking } from '../api/rankingApi'
export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
}
export function useRanking(categoryId?: number) {
  return useQuery({
    queryKey: ['ranking', categoryId],
    queryFn: () => fetchRanking(categoryId!),
    enabled: categoryId !== undefined,
  })
}

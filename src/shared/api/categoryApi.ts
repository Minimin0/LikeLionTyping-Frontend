// 카테고리 API를 공용 위치에 둔다. 게임 담당자는 병합 시 기존 조회 함수를 통합한다.
import { apiClient } from './apiClient'
import type { Category } from '../types/category.types'
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories')
  return data
}

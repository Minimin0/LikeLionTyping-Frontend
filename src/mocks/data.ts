// TODO: 백엔드 연동 시 교체 — 아래 데이터는 개발용이며 공식 기록이 아니다.
import type { Category } from '@/shared/types/category.types'
import type { RankingEntry } from '@/features/ranking/types/ranking.types'
export const mockCategories: Category[] = [
  { id: 1, code: 'CH01', name: '청춘의 주파수' },
  { id: 2, code: 'CH02', name: '개발자의 라디오' },
  { id: 3, code: 'CH03', name: '세 번째 채널 (준비 중)' },
]
export const mockRankings: Record<number, RankingEntry[]> = {
  1: [
    { rank: 1, nickname: '사자왕', elapsedMs: 36120 },
    { rank: 2, nickname: '타자왕', elapsedMs: 38990 },
    { rank: 3, nickname: '코딩사자', elapsedMs: 43821 },
  ],
  2: [
    { rank: 1, nickname: '주파수', elapsedMs: 41234 },
    { rank: 2, nickname: '개발사자', elapsedMs: 45900 },
  ],
  3: [],
}

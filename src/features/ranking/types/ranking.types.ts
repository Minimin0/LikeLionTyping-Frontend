// 공개 랭킹에서 사용할 필드만 정의한다. 전화번호와 내부 식별자는 포함하지 않는다.
export interface RankingEntry {
  rank: number
  nickname: string
  elapsedMs: number
}

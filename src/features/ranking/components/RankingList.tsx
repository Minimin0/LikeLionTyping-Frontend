// 공개 가능한 세 필드만 명시적으로 렌더링한다. 시간은 정수 ms를 SS.mmm로 표시한다.
import type { RankingEntry } from '../types/ranking.types'
export function formatRankingTime(ms: number) {
  return `${Math.floor(ms / 1000)}.${String(ms % 1000).padStart(3, '0')}`
}
export function RankingList({ entries }: { entries: RankingEntry[] }) {
  if (!entries.length)
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-semibold">아직 기록이 없습니다</p>
        <p className="mt-3 text-ink-muted">이 채널의 첫 번째 기록에 도전해보세요.</p>
      </div>
    )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">카테고리별 참가자 최고 기록</caption>
        <thead className="border-b border-line text-sm text-ink-muted">
          <tr>
            <th className="p-5" scope="col">
              순위
            </th>
            <th className="p-5" scope="col">
              닉네임
            </th>
            <th className="p-5 text-right" scope="col">
              완료 시간
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={`${entry.rank}-${i}`} className="border-b border-line last:border-0">
              <td className="p-5 font-mono text-xl text-accent">
                {String(entry.rank).padStart(2, '0')}
              </td>
              <th scope="row" className="max-w-48 break-words p-5 font-semibold">
                {entry.nickname}
              </th>
              <td className="whitespace-nowrap p-5 text-right font-mono text-xl tabular">
                {formatRankingTime(entry.elapsedMs)}
                <span className="ml-2 text-sm text-ink-muted">초</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

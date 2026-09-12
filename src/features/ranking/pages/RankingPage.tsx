// URL의 categoryId로 채널을 선택한다. 존재하지 않는 값은 첫 카테고리로 안전하게 표시한다.
import { Link, useSearchParams } from 'react-router-dom'
import { useCategories, useRanking } from '../hooks/useRanking'
import { RankingList } from '../components/RankingList'
import { RequestError } from '@/shared/components/RequestError'
export function RankingPage() {
  const [params, setParams] = useSearchParams()
  const categories = useCategories()
  const requested = Number(params.get('categoryId'))
  const selected =
    categories.data?.find((category) => category.id === requested) ?? categories.data?.[0]
  const ranking = useRanking(selected?.id)
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">THE CHART / PUBLIC RANKING</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">우리 채널의 타자왕</h1>
          <p className="mt-4 text-ink-muted">
            다섯 문장, 가장 빠른 순간. 카테고리별 최고 기록을 만나보세요.
          </p>
        </div>
        <Link to="/participate" className="secondary-button">
          나도 도전하기 ↗
        </Link>
      </div>
      <div className="mt-10">
        {categories.isPending ? (
          <p role="status">채널을 불러오는 중…</p>
        ) : categories.isError ? (
          <RequestError
            message="채널을 불러오지 못했습니다."
            onRetry={() => void categories.refetch()}
          />
        ) : !categories.data?.length ? (
          <p role="status">아직 등록된 채널이 없습니다.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-3" role="group" aria-label="랭킹 카테고리">
              {categories.data.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  aria-pressed={selected?.id === category.id}
                  className={`rounded-xl border px-5 py-4 text-left transition-colors ${selected?.id === category.id ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface-soft text-ink-muted hover:border-line-strong'}`}
                  onClick={() => setParams({ categoryId: String(category.id) })}
                >
                  <span className="mb-1 block font-mono text-xs">{category.code}</span>
                  <span className="font-semibold">{category.name}</span>
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
                <h2 className="font-bold">{selected?.name}</h2>
                <span className="text-xs text-ink-muted">참가자별 최고 기록 · 완료 시간 기준</span>
              </div>
              {ranking.isPending ? (
                <p role="status" className="p-10 text-center">
                  기록을 불러오는 중…
                </p>
              ) : ranking.isError ? (
                <div className="p-5">
                  <RequestError
                    message="랭킹을 불러오지 못했습니다. 연결을 확인해주세요."
                    onRetry={() => void ranking.refetch()}
                  />
                </div>
              ) : (
                <RankingList entries={ranking.data ?? []} />
              )}
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              순위와 기록은 서버에서 확인한 공식 결과입니다.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

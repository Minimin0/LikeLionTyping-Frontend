import { Keyboard, Shield, Trophy } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from '../features/admin/AdminPage'
import { CategoriesPage } from '../features/category/CategoriesPage'
import { GamePage } from '../features/game/GamePage'
import { ResultPage } from '../features/game/ResultPage'
import { ParticipantPage } from '../features/participant/ParticipantPage'
import { RankingPage } from '../features/ranking/RankingPage'
import { ROUTE_PATTERNS, ROUTES } from '../shared/constants/routes'

/* 아직 최종 화면이 준비되지 않은 경로 — 담당자가 자기 브랜치에서 교체한다.
   빈 컴포넌트라도 넣어둬야 빌드가 깨지지 않는다. */
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8 text-center opacity-60">{name} 준비 중</div>
)

export default function App() {
  return (
    <div className="min-h-screen bg-[#f4f6f2]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4">
          <Link
            to={ROUTES.LANDING}
            className="flex items-center gap-2 font-black text-zinc-900"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-yellow-300">
              <Keyboard className="size-5" aria-hidden />
            </span>
            멋쟁이 타자처럼
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-1">
            <Link
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
              to={ROUTES.RANKINGS}
              title="랭킹"
            >
              <Trophy className="size-5" />
            </Link>
            <Link
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
              to={ROUTES.ADMIN}
              title="운영자"
            >
              <Shield className="size-5" />
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Routes>
          {/* 홈. 현재는 참가자 입력 화면이 그대로 들어 있다. 분리는 Participant 담당자가 진행한다. */}
          <Route path={ROUTE_PATTERNS.LANDING} element={<ParticipantPage />} />

          {/* 새로 추가되는 경로. 화면 분리는 Participant 담당자가 진행하므로
              이번 PR에서는 경로만 뚫어두고 Placeholder로 채운다. */}
          <Route
            path={ROUTE_PATTERNS.PARTICIPATE}
            element={<Placeholder name="참가자 확인" />}
          />

          <Route
            path={ROUTE_PATTERNS.CATEGORIES}
            element={<CategoriesPage />}
          />
          <Route path={ROUTE_PATTERNS.GAME} element={<GamePage />} />
          <Route path={ROUTE_PATTERNS.RESULT} element={<ResultPage />} />
          <Route path={ROUTE_PATTERNS.RANKINGS} element={<RankingPage />} />
          <Route path={ROUTE_PATTERNS.ADMIN} element={<AdminPage />} />

          {/* 정의되지 않은 경로는 전부 메인으로 보낸다. 부스 화면에 404가 뜨면 안 된다. */}
          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
      </main>
    </div>
  )
}

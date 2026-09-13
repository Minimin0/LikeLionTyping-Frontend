import { Keyboard, Trophy } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from '../features/admin/AdminPage'
import { CategoriesPage } from '../features/category/CategoriesPage'
import { GamePage } from '../features/game/GamePage'
import { ResultPage } from '../features/game/ResultPage'
import { ParticipantPage } from '../features/participant/ParticipantPage'
import { RankingPage } from '../features/ranking/RankingPage'
import { ROUTE_PATTERNS, ROUTES } from '../shared/constants/routes'

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
          {/* Admin 정책 §15: 참가자 화면에는 Admin 진입 버튼을 노출하지
              않는다 — 운영자는 /admin 주소로 직접 접근한다. */}
          <nav aria-label="주요 메뉴" className="flex items-center gap-1">
            <Link
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
              to={ROUTES.RANKINGS}
              title="랭킹"
            >
              <Trophy className="size-5" />
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Routes>
          {/* 당분간 / 와 /participate 가 같은 화면을 가리킨다.
              가드가 /participate 로 보내는데 그곳이 빈 화면이면 참가자 정보 없이 보호 화면에
              접근한 사람이 아무것도 못 하고 갇힌다.
              Landing이 준비되면 / 만 Landing으로 교체하면 되므로, 이 구조가 인수인계도 쉽다. */}
          <Route path={ROUTE_PATTERNS.LANDING} element={<ParticipantPage />} />
          <Route
            path={ROUTE_PATTERNS.PARTICIPATE}
            element={<ParticipantPage />}
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

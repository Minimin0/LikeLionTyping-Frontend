import { Shield, Trophy, UserRound } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminPage } from '../features/admin/AdminPage'
import lpRed from '../features/admin/assets/images/LP_red.png'
import { CategoriesPage } from '../features/category/CategoriesPage'
import { GamePage } from '../features/game/GamePage'
import { ResultPage } from '../features/game/ResultPage'
import { LandingPage } from '../features/participant/LandingPage'
import { ParticipantPage } from '../features/participant/ParticipantPage'
import { RankingPage } from '../features/ranking/RankingPage'
import { ROUTE_PATTERNS, ROUTES } from '../shared/constants/routes'
import { RouteErrorBoundary } from '../shared/ErrorBoundary'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-[#f4f6f2]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4">
          <Link
            to={ROUTES.LANDING}
            className="flex items-center gap-2 font-black text-zinc-900"
          >
            <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-[#730c02] ring-1 ring-black/10">
              <img
                src={lpRed}
                alt=""
                aria-hidden="true"
                className="size-full scale-110 animate-spin-slow object-cover"
              />
            </span>
            멋쟁이 타자처럼
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-1">
            {pathname !== ROUTES.PARTICIPATE && (
              <span className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600">
                <UserRound className="size-5" />
                참가자 화면
              </span>
            )}
            {pathname !== ROUTES.RANKINGS && (
              <Link
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                to={ROUTES.RANKINGS}
              >
                <Trophy className="size-5" />
                랭킹
              </Link>
            )}
            {pathname !== ROUTES.ADMIN && (
              <Link
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                to={ROUTES.ADMIN}
              >
                <Shield className="size-5" />
                운영자
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* 렌더 에러가 나도 헤더는 남기고 본문만 폴백으로 바꾼다. 라우터 안쪽이라 폴백에서 이동도 된다. */}
        <RouteErrorBoundary>
          <Routes>
            <Route path={ROUTE_PATTERNS.LANDING} element={<LandingPage />} />
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
            <Route
              path="*"
              element={<Navigate to={ROUTES.LANDING} replace />}
            />
          </Routes>
        </RouteErrorBoundary>
      </main>
    </div>
  )
}

import { Shield, Trophy, UserRound } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminPage } from '../features/admin/AdminPage'
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
    // 디자인 전용 레이아웃이다. 라우트, 세션, API 호출은 아래 Routes 그대로 유지한다.
    <div className="radio-app">
      <header className="radio-header">
        <div className="radio-header-inner">
          <Link
            to={ROUTES.LANDING}
            className="radio-brand"
          >
            <strong>LIKELION TYPING</strong><span aria-hidden="true">/</span><span>성결대학교 축제 부스</span>
          </Link>
          <nav aria-label="주요 메뉴" className="radio-nav">
            {/* 현재 화면으로 가는 링크는 숨긴다. 운영자 화면에서는 참가자 화면으로 갈 수 있어야 한다. */}
            {pathname !== ROUTES.LANDING && (
              <Link
                className="radio-nav-link"
                to={ROUTES.LANDING}
              >
                <UserRound className="size-4" /> 참가자 화면
              </Link>
            )}
            {pathname !== ROUTES.RANKINGS && (
              <Link
                className="radio-nav-link"
                to={ROUTES.RANKINGS}
              >
                <Trophy className="size-4" /> 랭킹
              </Link>
            )}
            {pathname !== ROUTES.ADMIN && (
              <Link
                className="radio-nav-link"
                to={ROUTES.ADMIN}
              >
                <Shield className="size-4" /> 운영자
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="radio-main">
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

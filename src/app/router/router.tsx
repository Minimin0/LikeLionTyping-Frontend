/**
 * 라우터 정의.
 * 게임 관련 화면은 /game 하위로 묶어 다른 담당자의 라우트(/participants, /ranking, /admin)와
 * 충돌하지 않게 한다.
 */
import { Navigate, createBrowserRouter } from 'react-router-dom'

import { CategorySelectPage } from '@/features/game/pages/CategorySelectPage'
import { GamePage } from '@/features/game/pages/GamePage'

export const router = createBrowserRouter([
  {
    path: '/',
    // TODO: FE2의 참가자 식별 화면이 붙으면 그 화면을 진입점으로 교체한다.
    element: <Navigate to="/game/category" replace />,
  },
  { path: '/game/category', element: <CategorySelectPage /> },
  { path: '/game/play', element: <GamePage /> },
  { path: '*', element: <Navigate to="/game/category" replace /> },
])

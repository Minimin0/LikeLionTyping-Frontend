// 참가자 라우트와 병합 예정 지점을 정의한다. 팀원 소유 화면은 가져오거나 수정하지 않는다.
import { Navigate, type RouteObject } from 'react-router-dom'
import { LandingPage } from '@/features/participant/pages/LandingPage'
import { ParticipantIdentifyPage } from '@/features/participant/pages/ParticipantIdentifyPage'
import { RankingPage } from '@/features/ranking/pages/RankingPage'
import { getParticipantSession } from '@/features/participant/session/participantSession'
import { AppLayout } from '@/shared/components/AppLayout'
import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen'
function ParticipantPlaceholder({ label }: { label: string }) {
  const participant = getParticipantSession()
  if (!participant) return <Navigate to="/participate" replace />
  return <PlaceholderScreen label={label} participant={participant} />
}
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/participate', element: <ParticipantIdentifyPage /> },
      // TODO: 병합 시 팀원 B의 src/features/game/pages/CategorySelectPage.tsx로 교체한다.
      { path: '/game/category', element: <ParticipantPlaceholder label="채널 선택 화면" /> },
      // TODO: 병합 시 팀원 B의 src/features/game/pages/GamePage.tsx로 교체한다.
      { path: '/game/play', element: <ParticipantPlaceholder label="타자 게임 화면" /> },
      { path: '/ranking', element: <RankingPage /> },
      // TODO: 병합 시 팀원 A의 src/features/admin/pages/AdminPage.jsx로 교체한다.
      { path: '/admin', element: <PlaceholderScreen label="운영자 화면" /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]

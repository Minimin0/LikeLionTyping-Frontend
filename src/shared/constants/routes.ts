// 앱 전체의 경로를 한곳에서 관리한다.
// 컴포넌트에 경로 문자열을 직접 적으면 오타로 404가 나고,
// 경로가 바뀔 때 전부 찾아 고쳐야 하므로 반드시 이 상수를 사용한다.

export const ROUTES = {
  LANDING: '/',
  PARTICIPATE: '/participate',
  CATEGORIES: '/categories',
  GAME: (categoryId: number | string) => `/game/${categoryId}`,
  RESULT: (gameSessionId: number | string) => `/result/${gameSessionId}`,
  RANKINGS: '/rankings',
  ADMIN: '/admin',
  ADMIN_PAYMENTS: '/admin/payments',
} as const

// <Route path=""> 에 쓰는 패턴 문자열.
// 실제 이동 경로(ROUTES)와 라우트 정의 패턴을 구분해서 관리한다.
export const ROUTE_PATTERNS = {
  LANDING: '/',
  PARTICIPATE: '/participate',
  CATEGORIES: '/categories',
  GAME: '/game/:categoryId',
  RESULT: '/result/:gameSessionId',
  RANKINGS: '/rankings',
  ADMIN: '/admin',
  ADMIN_PAYMENTS: '/admin/payments',
} as const

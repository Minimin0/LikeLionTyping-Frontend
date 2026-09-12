/**
 * 전역 Provider 모음. 현재는 TanStack Query 하나뿐이다.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient를 모듈 스코프가 아니라 state로 만들어 테스트마다 새 인스턴스를 쓸 수 있게 한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 부스 환경에서는 창 전환이 잦아 포커스마다 재요청하면 불필요한 트래픽이 생긴다.
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { SessionProvider } from './app/session'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: false },
  },
})

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionProvider>
            <App />
          </SessionProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

// Production Mock 금지 (docs/FINAL_RELEASE_FRONTEND_2026-09-13.md #7):
// MSW는 dev 빌드에서만 켠다. 켜기에 실패해도(서비스워커 파일 누락 등)
// 렌더링은 항상 진행해 백엔드 연동 여부와 무관하게 앱이 뜨도록 한다.
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking()
  .catch((error) => console.error('[mocks] failed to start, continuing without mocks', error))
  .finally(renderApp)

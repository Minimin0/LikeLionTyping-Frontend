// React 앱 진입점. 개발 환경에서 명시적으로 켠 경우에만 Mock 서버를 사용한다.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/global.css'
import './styles/participant.css'
async function bootstrap() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  } else if ('serviceWorker' in navigator) {
    // Mock에서 실제 서버로 바꾼 같은 브라우저에 남은 MSW 등록만 해제한다.
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      if (registration.active?.scriptURL.endsWith('/mockServiceWorker.js'))
        await registration.unregister()
    }
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
void bootstrap().catch(() => {
  const root = document.getElementById('root')
  if (root) root.textContent = '화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.'
})

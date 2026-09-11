import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app/App'
import './styles/global.css'

/**
 * 개발 환경에서만 MSW를 켠다.
 * 워커가 준비되기 전에 렌더링하면 첫 요청이 Mock을 타지 않고 그대로 나가므로
 * start()가 끝난 뒤에 렌더링한다.
 */
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

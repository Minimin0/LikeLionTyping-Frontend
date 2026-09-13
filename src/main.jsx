import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

// Dev-only: set VITE_USE_MSW=true locally to exercise the Admin UI
// against fixture data while the real backend isn't reachable yet. Per
// the Admin policy (§11), this must never be on in a real build — it's
// gated behind an explicit env flag, off by default, and only ever
// imports the mock service worker when that flag is set.
async function enableMocking() {
  // import.meta.env.DEV is statically false in a production build, so
  // Vite tree-shakes this whole branch (and the MSW chunk) out of
  // `vite build` output entirely — mocks can never ship to Production.
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MSW !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  // worker.start() can resolve slightly before the service worker is
  // actually controlling this page (seen as an intermittent "request
  // falls through to the real dev server" race on rapid reloads) —
  // this closes that gap so no request ever fires before mocking is live.
  await navigator.serviceWorker.ready
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})

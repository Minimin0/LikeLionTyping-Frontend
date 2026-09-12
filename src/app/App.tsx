// 참가자 앱의 전역 Provider와 라우터를 조립한다.
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders'
import { router } from './router/router'
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

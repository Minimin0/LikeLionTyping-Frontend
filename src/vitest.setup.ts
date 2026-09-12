// 테스트 간 DOM, 참가자 세션, Mock 상태를 초기화한다.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'
import { resetMockParticipants } from './mocks/handlers'
import { apiClient } from './shared/api/apiClient'
apiClient.defaults.baseURL = 'http://localhost/api'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockParticipants()
  sessionStorage.clear()
})
afterAll(() => server.close())

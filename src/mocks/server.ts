// 테스트에서 실제 네트워크 없이 HTTP 요청과 응답 계약을 검증한다.
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)

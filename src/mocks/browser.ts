// 개발 브라우저에서만 사용하는 MSW 진입점. 운영 빌드에는 활성화하지 않는다.
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
export const worker = setupWorker(...handlers)

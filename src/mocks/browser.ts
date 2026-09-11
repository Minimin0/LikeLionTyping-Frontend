/**
 * 브라우저용 MSW 워커.
 * 개발 환경에서만 시작하며(main.tsx 참고), 프로덕션 번들에는 포함되지 않는다.
 */
import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// 실제 브라우저용 라우터를 생성한다. 테스트에서는 같은 경로 정의로 메모리 라우터를 쓴다.
import { createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'
export const router = createBrowserRouter(routes)

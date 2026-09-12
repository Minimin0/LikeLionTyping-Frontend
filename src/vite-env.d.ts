/// <reference types="vite/client" />
// 참가자 앱에서 사용하는 공개 환경변수 타입이다. 비밀값은 넣지 않는다.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK: string
}

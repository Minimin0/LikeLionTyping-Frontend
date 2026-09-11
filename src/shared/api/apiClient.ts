/**
 * 프로젝트 공통 Axios 인스턴스.
 * 컴포넌트에서 axios.get(...)을 직접 호출하지 않고 항상 이 client만 사용한다.
 * (baseURL / 헤더 / 추후 인증 처리를 한 곳에서 관리하기 위함)
 */
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

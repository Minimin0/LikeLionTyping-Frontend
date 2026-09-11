/**
 * API 에러 규격과 파싱 헬퍼.
 * 프론트는 HTTP status 숫자가 아니라 응답 body의 `code` 값으로 UI를 분기한다.
 * (같은 409라도 NICKNAME_MISMATCH / NO_AVAILABLE_PASS / INVALID_GAME_STATE는 전부 다른 화면이다)
 */
import { AxiosError } from 'axios'

/** Backend와 합의된 에러 코드 목록 */
export type ApiErrorCode =
  | 'NICKNAME_MISMATCH'
  | 'NO_AVAILABLE_PASS'
  | 'INVALID_GAME_STATE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  /** 네트워크 단절 등 서버 응답 자체를 못 받은 경우 */
  | 'NETWORK_ERROR'
  /** 계약에 없는 코드거나 파싱 실패 */
  | 'UNKNOWN'

/** 공통 에러 응답 body */
export interface ApiErrorBody {
  code: string
  message?: string
}

const KNOWN_CODES: ApiErrorCode[] = [
  'NICKNAME_MISMATCH',
  'NO_AVAILABLE_PASS',
  'INVALID_GAME_STATE',
  'UNAUTHORIZED',
  'FORBIDDEN',
]

/**
 * Axios 에러에서 계약상의 `code`를 뽑아낸다.
 * 401/403은 Backend가 body를 안 줄 수도 있어 status로 보정한다.
 */
export function getApiErrorCode(error: unknown): ApiErrorCode {
  if (!(error instanceof AxiosError)) return 'UNKNOWN'
  if (!error.response) return 'NETWORK_ERROR'

  const body = error.response.data as ApiErrorBody | undefined
  const code = body?.code
  if (code && (KNOWN_CODES as string[]).includes(code)) {
    return code as ApiErrorCode
  }

  if (error.response.status === 401) return 'UNAUTHORIZED'
  if (error.response.status === 403) return 'FORBIDDEN'
  return 'UNKNOWN'
}

/** 에러 코드별 사용자 안내 문구 */
export const API_ERROR_MESSAGE: Record<ApiErrorCode, string> = {
  NICKNAME_MISMATCH: '이미 등록된 전화번호입니다. 기존 닉네임으로 다시 입력해주세요.',
  NO_AVAILABLE_PASS: '재도전은 운영진에게 문의해주세요. 결제 확인 후 다시 참가할 수 있습니다.',
  INVALID_GAME_STATE: '이미 처리된 경기입니다. 기록 저장 여부는 운영진에게 확인해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NETWORK_ERROR: '네트워크 연결이 불안정합니다. 운영진에게 문의해주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다. 운영진에게 문의해주세요.',
}

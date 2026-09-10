import axios, { AxiosError } from 'axios'

type BackendError = { code?: string; message?: string }

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message = code,
  ) {
    super(message)
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: baseURL.replace(/\/$/, ''),
  timeout: 8_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendError>) => {
    const status = error.response?.status ?? 0
    const code =
      error.response?.data?.code ??
      (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR')
    return Promise.reject(
      new ApiError(
        code,
        status,
        error.response?.data?.message ?? error.message,
      ),
    )
  },
)

export const errorMessage = (error: unknown) => {
  const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
  return (
    {
      NICKNAME_MISMATCH:
        '이미 등록된 전화번호입니다. 처음 등록한 닉네임을 입력해주세요.',
      NO_AVAILABLE_PASS:
        '무료 참여를 이미 사용했습니다. 재도전은 운영진에게 문의해주세요.',
      INVALID_GAME_STATE: '이미 처리된 경기입니다. 저장된 결과를 확인해주세요.',
      ACTIVE_GAME_EXISTS: '다른 카테고리에서 진행 중인 경기가 있습니다.',
      SENTENCE_CONTENT_INVALID:
        '게임 준비 중 문제가 발생했습니다. 운영진에게 문의해주세요.',
      PARTICIPANT_NOT_FOUND: '참가자를 찾을 수 없습니다.',
      ADMIN_UNAUTHORIZED: '관리자 인증이 만료되었거나 올바르지 않습니다.',
      NETWORK_ERROR: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      COMPLETE_UNCERTAIN:
        '기록 저장 상태를 확인할 수 없습니다. 새 경기를 시작하지 말고 다시 확인해주세요.',
    }[code] ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
  )
}

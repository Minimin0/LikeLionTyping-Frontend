/**
 * 게임 도메인 타입 정의.
 * 위쪽은 Backend API DTO(계약), 아래쪽은 프론트 내부 게임 상태 타입이다.
 * Mock 응답도 반드시 이 DTO 타입을 그대로 사용해서, 실제 API 연동 시
 * 컴포넌트 코드를 다시 고치는 일이 없도록 한다.
 */

/* ------------------------------------------------------------------ */
/* API DTO — Backend 계약과 1:1로 대응한다. 임의로 필드를 추가하지 마라.  */
/* ------------------------------------------------------------------ */

/** GET /api/categories 응답 항목 */
export interface CategoryDto {
  id: number
  code: string
  name: string
}

/** 게임 문장 1개. sequence는 Backend가 정한 출제 순서이며 프론트에서 섞지 않는다. */
export interface SentenceDto {
  sequence: number
  content: string
}

/** POST /api/game-sessions 요청 */
export interface StartGameRequest {
  participantId: number
  categoryId: number
}

/** POST /api/game-sessions 응답 */
export interface GameSessionResponse {
  gameSessionId: number
  category: CategoryDto
  sentences: SentenceDto[]
}

/** POST /api/game-sessions/{id}/complete 요청. 프론트가 계산하는 값은 elapsedMs 하나뿐이다. */
export interface CompleteGameRequest {
  elapsedMs: number
}

/**
 * POST /api/game-sessions/{id}/complete 응답.
 * personalBest / personalBestMs / rank 는 전부 Backend가 결정한다.
 * 프론트에서 `newRecord < oldRecord` 같은 비교로 PB를 판단하면 안 된다.
 */
export interface CompleteGameResponse {
  elapsedMs: number
  personalBestMs: number
  personalBest: boolean
  rank: number
}

/** GameSession의 공식 상태. 이 값도 Backend Authority다. */
export type GameSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'INVALIDATED'

/**
 * GET /api/game-sessions/{id} 응답.
 * complete 요청이 타임아웃 났을 때 저장 여부를 재확인하기 위한 API다.
 * TODO: 백엔드와 스펙 확정 후 실제 호출 연결 (현재는 타입/함수 자리만 준비)
 */
export interface GameSessionDetailResponse {
  gameSessionId: number
  status: GameSessionStatus
  elapsedMs: number | null
  personalBestMs: number | null
  personalBest: boolean
  rank: number | null
}

/* ------------------------------------------------------------------ */
/* 프론트 내부 게임 상태 타입                                            */
/* ------------------------------------------------------------------ */

/**
 * 게임 State Machine 상태.
 * READY → COUNTDOWN → PLAYING → SUBMITTING → RESULT
 * SUBMITTING 구간에서는 완료 요청이 이미 날아간 상태라 Enter 입력을 전부 막는다.
 */
export type GameStatus = 'READY' | 'COUNTDOWN' | 'PLAYING' | 'SUBMITTING' | 'RESULT'

/**
 * 문장 안 글자 1개의 판정 상태.
 * - PENDING:   아직 입력하지 않음 (회색)
 * - CORRECT:   정타 (파랑)
 * - INCORRECT: 오타 (빨강 + 강조)
 * - COMPOSING: 한글 조합 중이라 아직 판정하지 않음 (연한 파랑)
 */
export type CharStatus = 'PENDING' | 'CORRECT' | 'INCORRECT' | 'COMPOSING'

/** 문장 렌더링용 글자 단위 셀 */
export interface CharCell {
  /** 화면에 그릴 글자. 초과 입력분은 사용자가 실제로 친 글자를 보여준다. */
  char: string
  status: CharStatus
  /** 제시 문장 길이를 넘어선 입력분인지 여부 */
  isOverflow: boolean
}

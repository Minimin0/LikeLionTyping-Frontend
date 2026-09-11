/**
 * 게임 관련 TanStack Query 훅.
 * Query Key와 Mutation 이름은 팀 계약(AGENTS.md §20)을 따른다.
 */
import { useMutation, useQuery } from '@tanstack/react-query'

import { completeGame, fetchCategories, startGame } from '../api/gameApi'
import type {
  CompleteGameResponse,
  GameSessionResponse,
  StartGameRequest,
} from '../types/game.types'

/** ["categories"] */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    // 축제 중 카테고리가 바뀔 일은 없으므로 재요청을 줄인다.
    staleTime: 5 * 60 * 1000,
  })
}

/** startGame — 세션 생성. isPending으로 시작 버튼 연타를 막는다. */
export function useStartGame() {
  return useMutation<GameSessionResponse, unknown, StartGameRequest>({
    mutationFn: startGame,
    // 실패를 자동 재시도하면 PlayPass가 중복 소비될 수 있으므로 재시도하지 않는다.
    retry: false,
  })
}

/** completeGame — 기록 제출. 중복 저장 방지를 위해 재시도하지 않는다. */
export function useCompleteGame() {
  return useMutation<CompleteGameResponse, unknown, { gameSessionId: number; elapsedMs: number }>({
    mutationFn: ({ gameSessionId, elapsedMs }) => completeGame(gameSessionId, { elapsedMs }),
    retry: false,
  })
}

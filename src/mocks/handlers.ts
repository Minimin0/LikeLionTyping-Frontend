/**
 * MSW 핸들러 모음.
 * 각 feature가 자기 핸들러를 소유하고, 여기서는 합치기만 한다.
 * (참가자 / 랭킹 / Admin 핸들러는 각 담당자가 이 배열에 추가한다)
 */
import { gameHandlers } from '@/features/game/api/gameHandlers'

export const handlers = [...gameHandlers]

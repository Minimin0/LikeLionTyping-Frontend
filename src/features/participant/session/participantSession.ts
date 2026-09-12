// 참가자별 식별 결과를 탭 단위로 관리한다. 탭 종료 시 사라지는 sessionStorage를 사용한다.
// 팀원 B의 MOCK_PARTICIPANT_ID는 수정하지 않는다. 병합 시 담당자가 이 조회 함수를 연결한다.
import { z } from 'zod'
import type { IdentifyParticipantResponse } from '../types/participant.types'
const KEY = 'participant'
const sessionSchema = z.object({
  participantId: z.number().int().positive(),
  nickname: z.string().min(1),
  isNewParticipant: z.boolean(),
  availablePassCount: z.number().int().nonnegative(),
})
export function saveParticipantSession(value: IdentifyParticipantResponse) {
  // 허용된 필드만 저장한다. 응답에 전화번호가 추가되어도 저장하지 않는다.
  sessionStorage.setItem(KEY, JSON.stringify(sessionSchema.parse(value)))
}
export function clearParticipantSession() {
  sessionStorage.removeItem(KEY)
}
export function getParticipantSession(): IdentifyParticipantResponse | null {
  try {
    const value = sessionStorage.getItem(KEY)
    if (!value) return null
    const parsed = sessionSchema.safeParse(JSON.parse(value))
    if (parsed.success) return parsed.data
    clearParticipantSession()
  } catch {
    /* 저장소 차단 또는 손상 시 식별되지 않은 참가자로 처리한다. */
  }
  return null
}

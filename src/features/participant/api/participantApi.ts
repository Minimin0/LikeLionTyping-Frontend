// 참가자 식별 요청을 공통 Axios 클라이언트로 보낸다.
import { apiClient } from '@/shared/api/apiClient'
import type {
  IdentifyParticipantRequest,
  IdentifyParticipantResponse,
} from '../types/participant.types'
export type {
  IdentifyParticipantRequest,
  IdentifyParticipantResponse,
} from '../types/participant.types'
export async function identifyParticipant(
  body: IdentifyParticipantRequest,
): Promise<IdentifyParticipantResponse> {
  const { data } = await apiClient.post<IdentifyParticipantResponse>('/participants/identify', body)
  return data
}

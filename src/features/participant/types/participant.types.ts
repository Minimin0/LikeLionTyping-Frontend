// 참가자 식별 API의 요청과 응답 계약. 전화번호는 세션에 저장하지 않는다.
export interface IdentifyParticipantRequest {
  nickname: string
  phone: string
}
export interface IdentifyParticipantResponse {
  participantId: number
  nickname: string
  isNewParticipant: boolean
  availablePassCount: number
}

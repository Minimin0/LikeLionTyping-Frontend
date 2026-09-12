// TODO: 백엔드 연동 시 교체 — 참가자와 공개 랭킹의 개발용 API 응답을 구성한다.
import { delay, http, HttpResponse } from 'msw'
import { mockCategories, mockRankings } from './data'
import { participantSchema } from '@/features/participant/utils/participantValidation'
import type { IdentifyParticipantResponse } from '@/features/participant/types/participant.types'
// 테스트용 기존 참가자. Mock에서만 사용하는 가상 전화번호이며 실제 정보 입력은 피한다.
const participants = new Map<string, IdentifyParticipantResponse>()
export function resetMockParticipants() {
  participants.clear()
  participants.set('01000000000', {
    participantId: 1,
    nickname: '기존사자',
    isNewParticipant: false,
    availablePassCount: 0,
  })
}
resetMockParticipants()
export const handlers = [
  http.post('*/api/participants/identify', async ({ request }) => {
    await delay(250)
    const parsed = participantSchema.safeParse(await request.json())
    if (!parsed.success) return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 })
    const { phone, nickname } = parsed.data
    // 네트워크 실패를 화면에서 재현하는 전용 가상 번호다.
    if (phone === '01099999999') return HttpResponse.error()
    const existing = participants.get(phone)
    if (existing && existing.nickname !== nickname)
      return HttpResponse.json({ code: 'NICKNAME_MISMATCH' }, { status: 409 })
    if (existing) return HttpResponse.json({ ...existing, isNewParticipant: false })
    const value = {
      participantId: participants.size + 1,
      nickname,
      isNewParticipant: true,
      availablePassCount: 1,
    }
    participants.set(phone, value)
    return HttpResponse.json(value)
  }),
  http.get('*/api/categories', () => HttpResponse.json(mockCategories)),
  http.get('*/api/rankings', async ({ request }) => {
    await delay(150)
    const categoryId = Number(new URL(request.url).searchParams.get('categoryId'))
    if (!(categoryId in mockRankings))
      return HttpResponse.json({ code: 'CATEGORY_NOT_FOUND' }, { status: 404 })
    return HttpResponse.json(mockRankings[categoryId])
  }),
]

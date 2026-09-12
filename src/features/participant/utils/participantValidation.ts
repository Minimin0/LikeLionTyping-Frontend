// 입력 형식을 정규화하고 서버에 보내기 전 기본 입력 조건을 검증한다.
import { z } from 'zod'
export const normalizePhone = (phone: string) => phone.replace(/\D/g, '')
export const participantSchema = z.object({
  // TODO: 팀 협의 후 조정 — 닉네임 최대 길이는 우선 20자로 제한한다.
  nickname: z
    .string()
    .trim()
    .min(1, '닉네임을 입력해주세요.')
    .max(20, '닉네임은 20자 이내로 입력해주세요.'),
  // 전화번호의 최종 유효성은 서버에서 판단한다. 프론트는 숫자 입력 여부만 확인한다.
  phone: z.string().transform(normalizePhone).pipe(z.string().min(1, '전화번호를 입력해주세요.')),
})

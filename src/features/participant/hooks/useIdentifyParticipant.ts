// 식별 요청을 자동 재전송하지 않는다. 사용자가 안내를 확인한 뒤 직접 재시도한다.
import { useMutation } from '@tanstack/react-query'
import { identifyParticipant } from '../api/participantApi'
export function useIdentifyParticipant() {
  return useMutation({
    mutationKey: ['identifyParticipant'],
    mutationFn: identifyParticipant,
    retry: false,
  })
}

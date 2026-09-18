import { Ticket, UserRound } from 'lucide-react'

export function ParticipantStatus({
  nickname,
  availablePassCount,
  className = '',
}: {
  nickname: string
  availablePassCount: number
  className?: string
}) {
  return (
    <div
      className={`radio-participant-status ${className}`}
      aria-label="현재 참가자"
    >
      <span>
        <UserRound className="size-4" aria-hidden />
        {nickname} 님
      </span>
      <span>
        <Ticket className="size-4" aria-hidden />
        남은 이용권 {availablePassCount}장
      </span>
    </div>
  )
}

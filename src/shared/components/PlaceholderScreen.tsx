// 담당자가 만든 화면을 병합할 때 교체할 임시 자리. 게임과 운영 기능을 재구현하지 않는다.
import { Link } from 'react-router-dom'
export function PlaceholderScreen({
  label,
  participant,
}: {
  label: string
  participant?: { nickname: string; isNewParticipant: boolean; availablePassCount: number } | null
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface-soft p-8 sm:p-12">
      <p className="eyebrow">NEXT CHANNEL</p>
      {participant && (
        <div role="status" className="my-7">
          <p className="text-2xl font-bold">{participant.nickname}님, 참가 확인 완료!</p>
          <p className="mt-3 text-accent">
            {participant.isNewParticipant
              ? '무료 1회 참여 가능'
              : `보유 이용권 ${participant.availablePassCount}회`}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            실제 참여 가능 여부는 게임 시작 시 확인됩니다.
          </p>
        </div>
      )}
      <h1 className="mt-4 text-2xl font-bold">{label} (병합 예정)</h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        이 자리는 팀원이 완성한 화면과 연결할 예정입니다.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/ranking" className="primary-button">
          랭킹 보기
        </Link>
        <Link to="/participate" className="secondary-button">
          다음 참가자
        </Link>
        <Link to="/" className="secondary-button">
          처음으로
        </Link>
      </div>
    </section>
  )
}

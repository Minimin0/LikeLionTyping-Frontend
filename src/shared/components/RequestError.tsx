// 조회 실패 시 사용자가 직접 재시도할 수 있는 공통 안내다.
export function RequestError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-line bg-surface-soft p-6">
      <p>{message}</p>
      <button type="button" className="secondary-button mt-4" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  )
}

/**
 * 렌더 중 throw를 잡아 앱 전체가 흰 화면이 되는 것을 막는 마지막 안전망.
 *
 * React에서 렌더 에러를 잡을 수 있는 건 클래스 컴포넌트뿐이라 훅으로는 만들 수 없다.
 * 이벤트 핸들러·비동기 에러는 여기서 잡히지 않으므로, API 응답 검증(client.ts)과
 * 배열 가드가 1차 방어선이고 이 컴포넌트는 그것마저 뚫렸을 때를 위한 것이다.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buttonClass, panelClass, secondaryButtonClass } from './components'
import { ROUTES } from './constants/routes'

type Props = { children: ReactNode; onHome: () => void }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 부스 화면에는 절대 노출하지 않고, 개발 중에만 콘솔로 확인한다. 에러를 삼키지는 않는다.
    if (import.meta.env.DEV)
      console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ hasError: false })

  home = () => {
    // 이미 홈에서 에러가 난 경우 경로가 안 바뀌어 key 리셋이 안 되므로 직접 초기화한다.
    this.reset()
    this.props.onHome()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    // 참가자가 직접 보는 화면이다. 기술적인 메시지나 스택은 절대 보여주지 않는다.
    return (
      <section className={panelClass} role="alert">
        <h1 className="text-2xl font-black">일시적인 오류가 발생했습니다</h1>
        <p className="mt-2 text-zinc-600">
          잠시 후 다시 시도해주세요. 문제가 계속되면 운영진에게 문의해주세요.
        </p>
        {/* 부스에서 급하게 누르므로 버튼을 크게 둔다. */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`${buttonClass} min-h-14 text-lg`}
            onClick={this.reset}
          >
            다시 시도
          </button>
          <button
            type="button"
            className={`${secondaryButtonClass} min-h-14 text-lg`}
            onClick={this.home}
          >
            처음으로
          </button>
        </div>
      </section>
    )
  }
}

/**
 * 라우터 안쪽에서 쓰는 래퍼.
 * ErrorBoundary는 한 번 에러가 나면 스스로 복구하지 않으므로 경로가 바뀔 때
 * key로 다시 마운트해 초기화한다. 라우터 바깥에 두면 폴백에서 이동을 시킬 수 없다.
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <ErrorBoundary
      key={location.pathname}
      onHome={() => navigate(ROUTES.LANDING, { replace: true })}
    >
      {children}
    </ErrorBoundary>
  )
}

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteErrorBoundary } from './ErrorBoundary'

/**
 * 테스트가 직접 켜고 끄는 스위치.
 * "첫 렌더만 throw" 방식은 React가 렌더 에러 뒤 한 번 동기 재시도를 하기 때문에
 * 재시도 렌더에서 통과해버려 경계가 발동하지 않는다. 그래서 외부 플래그로 제어한다.
 */
const fault = { active: true }

function FaultyPage() {
  if (fault.active) throw new Error('boom')
  return <p>복구된 화면</p>
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {/* 경계 바깥 링크 — 경로 변경으로 key 리셋이 되는지 확인하는 용도 */}
      <Link to="/ok">다른 화면으로</Link>
      <RouteErrorBoundary>
        <Routes>
          <Route path="/admin" element={<p>홈 화면</p>} />
          <Route path="/boom" element={<FaultyPage />} />
          <Route path="/ok" element={<p>정상 화면</p>} />
        </Routes>
      </RouteErrorBoundary>
    </MemoryRouter>,
  )
}

/**
 * React 19는 렌더 에러를 경계가 잡은 뒤에도 "복구 가능한 에러"로 window.reportError에
 * 한 번 더 보고한다. vitest는 이걸 unhandled error로 집계해 테스트를 실패시키므로,
 * 이 테스트가 일부러 던지는 'boom'만 처리된 것으로 표시한다.
 */
const markIntendedErrorHandled = (event: ErrorEvent) => {
  if (String(event.error?.message ?? event.message).includes('boom'))
    event.preventDefault()
}

beforeEach(() => {
  fault.active = true
  window.addEventListener('error', markIntendedErrorHandled)
  // React가 렌더 에러를 콘솔에 찍는 것까지 테스트 출력에 섞이지 않게 막는다
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  window.removeEventListener('error', markIntendedErrorHandled)
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('자식이 throw하면 참가자용 폴백이 뜨고 기술 메시지는 노출되지 않는다', () => {
    renderApp('/boom')

    expect(screen.getByRole('alert')).toHaveTextContent(
      '일시적인 오류가 발생했습니다',
    )
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '처음으로' })).toBeInTheDocument()
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument()
  })

  it('"다시 시도"를 누르면 에러 상태가 풀리고 현재 화면이 다시 렌더된다', async () => {
    const user = userEvent.setup()
    renderApp('/boom')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // 원인이 해소된 뒤 다시 시도
    fault.active = false
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('복구된 화면')).toBeInTheDocument()
  })

  it('원인이 그대로면 "다시 시도" 후에도 폴백이 유지된다 (흰 화면이 되지 않는다)', async () => {
    const user = userEvent.setup()
    renderApp('/boom')

    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('"처음으로"를 누르면 홈으로 이동하고 정상 화면이 뜬다', async () => {
    const user = userEvent.setup()
    renderApp('/boom')

    await user.click(screen.getByRole('button', { name: '처음으로' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('홈 화면')).toBeInTheDocument()
  })

  it('경로가 바뀌면 에러 상태가 초기화된다', async () => {
    const user = userEvent.setup()
    renderApp('/boom')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // 폴백이 아닌 바깥 링크로 이동 → key(pathname)가 바뀌어 경계가 새로 마운트된다
    await user.click(screen.getByRole('link', { name: '다른 화면으로' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('정상 화면')).toBeInTheDocument()
  })
})

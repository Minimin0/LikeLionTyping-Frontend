// 명세에 정의된 모든 경로와 식별되지 않은 참가자의 직접 접근을 확인한다.
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { AppProviders } from '../providers/AppProviders'
import { routes } from './routes'
import { saveParticipantSession } from '@/features/participant/session/participantSession'
describe('라우팅 셸', () => {
  it.each([
    ['/', '멋쟁이'],
    ['/participate', '방송 전'],
    ['/game/category', '채널 선택 화면'],
    ['/game/play', '타자 게임 화면'],
    ['/ranking', '우리 채널'],
    ['/admin', '운영자 화면'],
    ['/missing', '멋쟁이'],
  ])('%s 경로를 렌더링한다', async (path, heading) => {
    saveParticipantSession({
      participantId: 1,
      nickname: '사자',
      isNewParticipant: true,
      availablePassCount: 1,
    })
    render(
      <AppProviders>
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
      </AppProviders>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: new RegExp(heading) }),
    ).toBeInTheDocument()
  })
  it('참가자 정보 없이 게임 경로 진입 시 식별 화면으로 이동한다', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/game/category'] })
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )
    expect(await screen.findByLabelText('닉네임')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/participate')
  })
})

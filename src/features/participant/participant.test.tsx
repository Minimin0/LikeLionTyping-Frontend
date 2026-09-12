// 참가자 입력부터 세션 저장까지 HTTP 경계를 포함해 검증한다.
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { delay, http, HttpResponse } from 'msw'
import { describe, it, expect, vi } from 'vitest'
import { routes } from '@/app/router/routes'
import { server } from '@/mocks/server'
import { normalizePhone, participantSchema } from './utils/participantValidation'
import { getParticipantSession, saveParticipantSession } from './session/participantSession'
function setup() {
  const router = createMemoryRouter(routes, { initialEntries: ['/participate'] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router, user: userEvent.setup(), client }
}
async function fill(
  user: ReturnType<typeof userEvent.setup>,
  nickname = '새사자',
  phone = '010-1234-5678',
) {
  await user.type(screen.getByLabelText('닉네임'), nickname)
  await user.type(screen.getByLabelText('전화번호'), phone)
}
describe('참가자 흐름', () => {
  it('전화번호 하이픈과 공백을 제거한다', () => {
    expect(normalizePhone('010-1234 5678')).toBe('01012345678')
    expect(normalizePhone('01012345678')).toBe('01012345678')
    expect(participantSchema.safeParse({ nickname: '   ', phone: '010' }).success).toBe(false)
  })
  it('신규 참가자의 정규화된 요청을 한 번 보내고 세션에서 전화번호를 제외한다', async () => {
    const requestBody = vi.fn()
    server.use(
      http.post('*/api/participants/identify', async ({ request }) => {
        requestBody(await request.json())
        await delay(100)
        return HttpResponse.json({
          participantId: 5,
          nickname: '새사자',
          isNewParticipant: true,
          availablePassCount: 1,
          phone: '노출금지',
        })
      }),
    )
    const { user, router, client } = setup()
    await fill(user)
    const form = screen.getByRole('button', { name: '확인하고 다음으로 →' }).closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(await screen.findByText('무료 1회 참여 가능')).toBeInTheDocument()
    expect(requestBody).toHaveBeenCalledTimes(1)
    expect(requestBody).toHaveBeenCalledWith({ nickname: '새사자', phone: '01012345678' })
    expect(router.state.location.pathname).toBe('/game/category')
    expect(getParticipantSession()?.participantId).toBe(5)
    expect(sessionStorage.getItem('participant')).not.toMatch(/phone|노출금지|01012345678/)
    expect(client.getMutationCache().getAll()).toHaveLength(0)
  })
  it('기존 참가자에게 보유 이용권 수를 안내한다', async () => {
    const { user } = setup()
    await fill(user, '기존사자', '01000000000')
    await user.click(screen.getByRole('button', { name: '확인하고 다음으로 →' }))
    expect(await screen.findByText('보유 이용권 0회')).toBeInTheDocument()
  })
  it('닉네임 불일치 후 수정해서 다시 제출할 수 있다', async () => {
    const { user } = setup()
    await fill(user, '다른사자', '01000000000')
    await user.click(screen.getByRole('button', { name: '확인하고 다음으로 →' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('기존 닉네임으로 다시 입력해주세요.')
    await user.clear(screen.getByLabelText('닉네임'))
    await user.type(screen.getByLabelText('닉네임'), '기존사자')
    await user.click(screen.getByRole('button', { name: '확인하고 다음으로 →' }))
    expect(await screen.findByText('보유 이용권 0회')).toBeInTheDocument()
  })
  it('네트워크 오류 후 재시도할 수 있다', async () => {
    server.use(http.post('*/api/participants/identify', () => HttpResponse.error()))
    const { user } = setup()
    await fill(user)
    await user.click(screen.getByRole('button', { name: '확인하고 다음으로 →' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('다시 시도해주세요')
    expect(screen.getByRole('button', { name: '확인하고 다음으로 →' })).toBeEnabled()
    expect(getParticipantSession()).toBeNull()
  })
  it('다음 참가자 입력 시 이전 세션을 초기화한다', async () => {
    saveParticipantSession({
      participantId: 7,
      nickname: '이전',
      isNewParticipant: true,
      availablePassCount: 1,
    })
    setup()
    await waitFor(() => expect(getParticipantSession()).toBeNull())
  })
  it('저장소가 손상되어도 앱을 중단하지 않는다', () => {
    sessionStorage.setItem('participant', '{bad')
    expect(getParticipantSession()).toBeNull()
    sessionStorage.setItem('participant', JSON.stringify({ participantId: -1 }))
    expect(getParticipantSession()).toBeNull()
  })
})

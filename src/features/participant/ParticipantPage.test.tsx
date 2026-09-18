import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider } from '../../app/session'
import { apiClient } from '../../shared/api/client'
import { ParticipantPage } from './ParticipantPage'

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SessionProvider>
          <ParticipantPage />
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function submit(phone: string) {
  const user = userEvent.setup()
  renderPage()

  await user.type(screen.getByLabelText('닉네임'), '타자왕')
  await user.type(screen.getByLabelText('휴대전화 번호'), phone)
  await user.click(
    screen.getByLabelText(
      /전화번호는 무료 참여 여부 확인, 게임 기록 관리, 본인 확인 및 수상자 연락/,
    ),
  )
  await user.click(screen.getByRole('button', { name: /참가하기/ }))
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('ParticipantPage phone validation', () => {
  it.each(['01012345678', '010-1234-5678', '010 1234 5678'])(
    'allows %s',
    async (phone) => {
      const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: {
          participantId: 1,
          nickname: '타자왕',
          isNewParticipant: true,
          availablePassCount: 1,
        },
      })

      await submit(phone)

      await waitFor(() =>
        expect(post).toHaveBeenCalledWith('/participants/identify', {
          nickname: '타자왕',
          phone,
        }),
      )
    },
  )

  it.each(['0101234567', '010-123-4567', '010123456789', '01112345678'])(
    'blocks invalid phone %s without calling identify API',
    async (phone) => {
      const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })

      await submit(phone)

      expect(
        await screen.findByText(
          '010으로 시작하는 11자리 휴대전화 번호를 입력해주세요.',
        ),
      ).toBeInTheDocument()
      expect(post).not.toHaveBeenCalled()
    },
  )
})

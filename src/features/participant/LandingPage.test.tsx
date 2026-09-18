import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { ROUTES } from '../../shared/constants/routes'
import { LandingPage } from './LandingPage'

afterEach(cleanup)

describe('LandingPage', () => {
  it('참가자 입력과 공개 랭킹으로 이동하는 링크를 제공한다', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('link', { name: /참가하기/ })).toHaveAttribute(
      'href',
      ROUTES.PARTICIPATE,
    )
    expect(screen.getByRole('link', { name: '랭킹 보기' })).toHaveAttribute(
      'href',
      ROUTES.RANKINGS,
    )
  })

  it('CH02 표시 이름은 멋쟁이사자처럼으로 보여준다', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('멋쟁이사자처럼')).toBeInTheDocument()
    expect(screen.queryByText('캠퍼스 주파수')).not.toBeInTheDocument()
  })
})

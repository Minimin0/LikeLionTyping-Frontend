import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, Empty } from './components'

describe('shared feedback', () => {
  it('exposes errors and empty ranking state accessibly', () => {
    render(
      <>
        <Alert>연결 실패</Alert>
        <Empty>기록 없음</Empty>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('연결 실패')
    expect(screen.getByText('기록 없음')).toBeVisible()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the Korean label for a known status', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('ON AIR')).toBeInTheDocument()
  })

  it('maps status to the matching badge class', () => {
    render(<StatusBadge status="COMPLETED" />)
    expect(screen.getByText('방송 완료')).toHaveClass('badge--completed')
  })

  it('falls back to the raw status string if it is unrecognized', () => {
    render(<StatusBadge status="SOMETHING_NEW" />)
    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument()
  })
})

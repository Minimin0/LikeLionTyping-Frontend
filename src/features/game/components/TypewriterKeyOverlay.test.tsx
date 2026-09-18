import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypewriterKeyOverlay } from './TypewriterKeyOverlay'

describe('TypewriterKeyOverlay', () => {
  it('renders the adjusted Backspace highlight hotspot', () => {
    const { container } = render(
      <TypewriterKeyOverlay activeCodes={new Set(['Backspace'])} />,
    )

    const hotspot = container.querySelector('.typewriter-key-hotspot')

    expect(hotspot).toBeInTheDocument()
    expect(hotspot).toHaveStyle({
      left: '85.2%',
      top: '57.7%',
      width: '5.7%',
    })
  })
})

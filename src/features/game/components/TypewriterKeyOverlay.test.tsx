import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypewriterKeyOverlay } from './TypewriterKeyOverlay'

describe('TypewriterKeyOverlay', () => {
  it('places the number row highlights over the supplied Korean typewriter', () => {
    const { container } = render(
      <TypewriterKeyOverlay
        activeCodes={
          new Set([
            'Backquote',
            'Digit1',
            'Digit2',
            'Digit3',
            'Digit4',
            'Digit5',
            'Digit6',
            'Digit7',
            'Digit8',
            'Digit9',
            'Digit0',
            'Minus',
            'Equal',
          ])
        }
      />,
    )

    const hotspots = [...container.querySelectorAll('.typewriter-key-hotspot')]

    expect(hotspots).toHaveLength(13)
    expect(hotspots[0]).toHaveStyle({ left: '23.3%', top: '61%' })
    expect(hotspots[1]).toHaveStyle({ left: '27.3%', top: '61%' })
    expect(hotspots[10]).toHaveStyle({ left: '63.9%', top: '61%' })
    expect(hotspots[11]).toHaveStyle({ left: '63.9%', top: '61%' })
    expect(hotspots[12]).toHaveStyle({ left: '68%', top: '61%' })
  })

  it('renders the adjusted Backspace highlight hotspot', () => {
    const { container } = render(
      <TypewriterKeyOverlay activeCodes={new Set(['Backspace'])} />,
    )

    const hotspot = container.querySelector('.typewriter-key-hotspot')

    expect(hotspot).toBeInTheDocument()
    expect(hotspot).toHaveStyle({
      left: '74%',
      top: '61%',
      width: '6.7%',
    })
  })

  it('keeps Korean letter, Shift, Enter, and Space highlights on their keys', () => {
    const { container } = render(
      <TypewriterKeyOverlay
        activeCodes={new Set(['KeyR', 'ShiftLeft', 'Enter', 'Space'])}
      />,
    )
    const [letter, shift, enter, space] = container.querySelectorAll('.typewriter-key-hotspot')

    expect(letter).toHaveStyle({ left: '41.1%', top: '67.6%' })
    expect(shift).toHaveStyle({ left: '23.2%', top: '81.4%' })
    expect(enter).toHaveStyle({ left: '76.4%', top: '74.4%' })
    expect(space).toHaveStyle({ left: '48%', top: '88.4%', width: '32.5%' })
  })
})

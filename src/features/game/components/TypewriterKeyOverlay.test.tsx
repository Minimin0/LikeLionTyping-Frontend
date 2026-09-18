import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypewriterKeyOverlay } from './TypewriterKeyOverlay'

describe('TypewriterKeyOverlay', () => {
  it('renders the adjusted number row hotspots without a Backquote slot', () => {
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

    expect(hotspots).toHaveLength(12)
    expect(hotspots.map((hotspot) => hotspot.getAttribute('style'))).toEqual([
      'left: 23%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 28.3%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 33.1%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 37.7%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 42.3%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 46.9%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 51.5%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 56.1%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 60.8%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 65.4%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 70%; top: 58%; width: 4.2%; height: 5.5%;',
      'left: 74.4%; top: 58%; width: 4.2%; height: 5.5%;',
    ])
  })

  it('renders the adjusted Backspace highlight hotspot', () => {
    const { container } = render(
      <TypewriterKeyOverlay activeCodes={new Set(['Backspace'])} />,
    )

    const hotspot = container.querySelector('.typewriter-key-hotspot')

    expect(hotspot).toBeInTheDocument()
    expect(hotspot).toHaveStyle({
      left: '79%',
      top: '57.8%',
      width: '5.2%',
    })
  })
})

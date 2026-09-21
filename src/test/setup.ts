import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

class TestAudio {
  currentTime = 0
  loop = false
  preload = ''
  volume = 1
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()

  constructor(public src: string) {}
}

vi.stubGlobal('Audio', TestAudio)

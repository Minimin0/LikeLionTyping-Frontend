const KEY_POINTS: Record<string, { x: number; y: number; w?: number }> = {
  Backquote: { x: 26.2, y: 61.5 },
  Digit1: { x: 32.1, y: 61.4 },
  Digit2: { x: 37.6, y: 61.3 },
  Digit3: { x: 43.1, y: 61.4 },
  Digit4: { x: 48.6, y: 61.4 },
  Digit5: { x: 54.1, y: 61.3 },
  Digit6: { x: 59.6, y: 61.3 },
  Digit7: { x: 65.2, y: 61.4 },
  Digit8: { x: 70.8, y: 61.3 },
  Digit9: { x: 76.4, y: 61.4 },
  Digit0: { x: 81.7, y: 61.3 },
  Minus: { x: 86.7, y: 61.4 },
  Equal: { x: 91.5, y: 61.4 },
  Backspace: { x: 96.2, y: 61.5, w: 5.2 },
  Tab: { x: 27.8, y: 69.1, w: 5.7 },
  KeyQ: { x: 35.0, y: 69.1 },
  KeyW: { x: 40.5, y: 69.1 },
  KeyE: { x: 46.0, y: 69.1 },
  KeyR: { x: 51.5, y: 69.1 },
  KeyT: { x: 57.0, y: 69.1 },
  KeyY: { x: 62.6, y: 69.1 },
  KeyU: { x: 68.1, y: 69.1 },
  KeyI: { x: 73.6, y: 69.1 },
  KeyO: { x: 79.1, y: 69.1 },
  KeyP: { x: 84.6, y: 69.1 },
  BracketLeft: { x: 89.8, y: 69.1 },
  BracketRight: { x: 94.7, y: 69.1 },
  CapsLock: { x: 28.2, y: 76.8, w: 8.2 },
  KeyA: { x: 36.8, y: 76.8 },
  KeyS: { x: 42.3, y: 76.8 },
  KeyD: { x: 47.8, y: 76.8 },
  KeyF: { x: 53.2, y: 76.8 },
  KeyG: { x: 58.8, y: 76.8 },
  KeyH: { x: 64.3, y: 76.8 },
  KeyJ: { x: 69.8, y: 76.8 },
  KeyK: { x: 75.2, y: 76.8 },
  KeyL: { x: 80.8, y: 76.8 },
  Semicolon: { x: 86.3, y: 76.8 },
  Quote: { x: 91.5, y: 76.8 },
  Enter: { x: 96.5, y: 76.8, w: 5.7 },
  ShiftLeft: { x: 28.5, y: 84.6, w: 8.6 },
  KeyZ: { x: 38.4, y: 84.6 },
  KeyX: { x: 44.0, y: 84.6 },
  KeyC: { x: 49.5, y: 84.6 },
  KeyV: { x: 55.0, y: 84.6 },
  KeyB: { x: 60.5, y: 84.6 },
  KeyN: { x: 66.0, y: 84.6 },
  KeyM: { x: 71.5, y: 84.6 },
  Comma: { x: 77.0, y: 84.6 },
  Period: { x: 82.5, y: 84.6 },
  Slash: { x: 88.0, y: 84.6 },
  ShiftRight: { x: 94.5, y: 84.6, w: 8.6 },
  Space: { x: 59.5, y: 92.3, w: 43 },
}

export function TypewriterKeyOverlay({ activeCodes }: { activeCodes: Set<string> }) {
  return (
    <div className="typewriter-key-layer" aria-hidden>
      {[...activeCodes].map((code) => {
        const point = KEY_POINTS[code]
        if (!point) return null
        return (
          <span
            key={code}
            className="typewriter-key-hotspot"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${point.w ?? 4.2}%`,
            }}
          />
        )
      })}
    </div>
  )
}

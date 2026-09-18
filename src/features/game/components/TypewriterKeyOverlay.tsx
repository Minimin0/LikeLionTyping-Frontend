const KEY_POINTS: Record<string, { x: number; y: number; w?: number; h?: number }> = {
  Backquote: { x: 23.0, y: 58.0 },
  Digit1: { x: 28.3, y: 58.0 },
  Digit2: { x: 33.1, y: 58.0 },
  Digit3: { x: 37.7, y: 58.0 },
  Digit4: { x: 42.3, y: 58.0 },
  Digit5: { x: 46.9, y: 58.0 },
  Digit6: { x: 51.5, y: 58.0 },
  Digit7: { x: 56.1, y: 58.0 },
  Digit8: { x: 60.8, y: 58.0 },
  Digit9: { x: 65.4, y: 58.0 },
  Digit0: { x: 70.0, y: 58.0 },
  Minus: { x: 74.4, y: 58.0 },
  Equal: { x: 78.9, y: 58.0 },
  Backspace: { x: 79.0, y: 57.8, w: 5.2, h: 5.1 },
  Tab: { x: 23.4, y: 65.6, w: 7.0, h: 5.4 },
  KeyQ: { x: 29.2, y: 65.6 },
  KeyW: { x: 33.4, y: 65.6 },
  KeyE: { x: 37.7, y: 65.6 },
  KeyR: { x: 41.9, y: 65.6 },
  KeyT: { x: 46.0, y: 65.6 },
  KeyY: { x: 50.0, y: 65.6 },
  KeyU: { x: 54.2, y: 65.6 },
  KeyI: { x: 58.3, y: 65.6 },
  KeyO: { x: 62.5, y: 65.6 },
  KeyP: { x: 66.5, y: 65.6 },
  BracketLeft: { x: 70.7, y: 65.6 },
  BracketRight: { x: 75.0, y: 65.6 },
  CapsLock: { x: 23.2, y: 73.0, w: 8.6, h: 5.8 },
  KeyA: { x: 29.2, y: 73.0 },
  KeyS: { x: 33.5, y: 73.0 },
  KeyD: { x: 37.8, y: 73.0 },
  KeyF: { x: 42.1, y: 73.0 },
  KeyG: { x: 46.4, y: 73.0 },
  KeyH: { x: 50.7, y: 73.0 },
  KeyJ: { x: 55.0, y: 73.0 },
  KeyK: { x: 59.3, y: 73.0 },
  KeyL: { x: 63.6, y: 73.0 },
  Semicolon: { x: 67.7, y: 73.0 },
  Quote: { x: 71.8, y: 73.0 },
  Enter: { x: 79.7, y: 73.0, w: 5.5, h: 6.5 },
  ShiftLeft: { x: 22.9, y: 81.0, w: 9.0, h: 5.8 },
  KeyZ: { x: 30.8, y: 81.0 },
  KeyX: { x: 35.4, y: 81.0 },
  KeyC: { x: 40.0, y: 81.0 },
  KeyV: { x: 44.5, y: 81.0 },
  KeyB: { x: 49.0, y: 81.0 },
  KeyN: { x: 53.6, y: 81.0 },
  KeyM: { x: 58.1, y: 81.0 },
  Comma: { x: 62.7, y: 81.0 },
  Period: { x: 67.3, y: 81.0 },
  Slash: { x: 71.6, y: 81.0 },
  ShiftRight: { x: 78.0, y: 81.0, w: 8.6, h: 5.8 },
  Space: { x: 50.7, y: 88.5, w: 39.5, h: 4.9 },
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
              height: `${point.h ?? 5.5}%`,
            }}
          />
        )
      })}
    </div>
  )
}

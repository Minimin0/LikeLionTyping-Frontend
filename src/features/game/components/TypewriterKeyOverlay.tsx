const KEY_POINTS: Record<string, { x: number; y: number; w?: number; h?: number }> = {
  Backquote: { x: 23.3, y: 61.0 },
  Digit1: { x: 27.3, y: 61.0 },
  Digit2: { x: 31.2, y: 61.0 },
  Digit3: { x: 35.3, y: 61.0 },
  Digit4: { x: 39.4, y: 61.0 },
  Digit5: { x: 43.5, y: 61.0 },
  Digit6: { x: 47.5, y: 61.0 },
  Digit7: { x: 51.6, y: 61.0 },
  Digit8: { x: 55.7, y: 61.0 },
  Digit9: { x: 59.8, y: 61.0 },
  // 제공된 이미지에는 0 키가 없어 0 입력도 숫자열 끝 키에서 표시한다.
  Digit0: { x: 63.9, y: 61.0 },
  Minus: { x: 63.9, y: 61.0 },
  Equal: { x: 68.0, y: 61.0 },
  Backspace: { x: 74.0, y: 61.0, w: 6.7, h: 5.8 },
  Tab: { x: 23.3, y: 67.6, w: 5.8, h: 5.8 },
  KeyQ: { x: 28.7, y: 67.6 },
  KeyW: { x: 32.8, y: 67.6 },
  KeyE: { x: 37.0, y: 67.6 },
  KeyR: { x: 41.1, y: 67.6 },
  KeyT: { x: 45.3, y: 67.6 },
  KeyY: { x: 49.4, y: 67.6 },
  KeyU: { x: 53.6, y: 67.6 },
  KeyI: { x: 57.7, y: 67.6 },
  KeyO: { x: 61.9, y: 67.6 },
  KeyP: { x: 66.1, y: 67.6 },
  BracketLeft: { x: 70.3, y: 67.6 },
  BracketRight: { x: 75.4, y: 67.6 },
  CapsLock: { x: 22.8, y: 74.4, w: 7.7, h: 5.8 },
  KeyA: { x: 29.6, y: 74.4 },
  KeyS: { x: 33.7, y: 74.4 },
  KeyD: { x: 37.9, y: 74.4 },
  KeyF: { x: 42.1, y: 74.4 },
  KeyG: { x: 46.3, y: 74.4 },
  KeyH: { x: 50.5, y: 74.4 },
  KeyJ: { x: 54.7, y: 74.4 },
  KeyK: { x: 58.9, y: 74.4 },
  KeyL: { x: 63.0, y: 74.4 },
  Semicolon: { x: 67.2, y: 74.4 },
  Quote: { x: 71.4, y: 74.4 },
  Enter: { x: 76.4, y: 74.4, w: 5.2, h: 5.8 },
  ShiftLeft: { x: 23.2, y: 81.4, w: 8.8, h: 5.8 },
  KeyZ: { x: 30.5, y: 81.4 },
  KeyX: { x: 34.9, y: 81.4 },
  KeyC: { x: 39.3, y: 81.4 },
  KeyV: { x: 43.7, y: 81.4 },
  KeyB: { x: 48.1, y: 81.4 },
  KeyN: { x: 52.6, y: 81.4 },
  KeyM: { x: 57.0, y: 81.4 },
  Comma: { x: 61.4, y: 81.4 },
  Period: { x: 65.8, y: 81.4 },
  Slash: { x: 70.3, y: 81.4 },
  ShiftRight: { x: 76.4, y: 81.4, w: 7.0, h: 5.8 },
  ControlLeft: { x: 20.9, y: 88.4, w: 4.6, h: 5.1 },
  AltLeft: { x: 26.3, y: 88.4, w: 4.6, h: 5.1 },
  Space: { x: 48.0, y: 88.4, w: 32.5, h: 4.8 },
  Lang1: { x: 67.8, y: 88.4, w: 4.6, h: 5.1 },
  Lang2: { x: 73.0, y: 88.4, w: 4.6, h: 5.1 },
  ControlRight: { x: 78.0, y: 88.4, w: 4.6, h: 5.1 },
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
              width: `${point.w ?? 3.6}%`,
              height: `${point.h ?? 5.8}%`,
            }}
          />
        )
      })}
    </div>
  )
}

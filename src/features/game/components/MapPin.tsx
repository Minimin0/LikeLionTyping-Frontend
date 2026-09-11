/**
 * 현재 목표 대학에 꽂히는 지도 핀 + 이름 라벨 + 물결 애니메이션.
 *
 * 항상 다른 레이어 위에 그려야 하므로 SVG에서 마지막에 렌더링한다.
 */
import { MAP_HEIGHT, MAP_WIDTH } from '../utils/mapProjection'

/**
 * 지도 핀 — 위가 둥글고 아래가 뾰족한 물방울 모양.
 * (0,0)이 "꽂히는 끝점"이 되도록 좌표를 잡아, 대학 좌표에 그대로 translate 하면
 * 핀 몸통 중심이 아니라 뾰족한 끝이 정확히 그 위치를 가리킨다.
 */
const PIN_PATH = 'M0,0 C-6,-9 -9,-12 -9,-17 A9,9 0 1,1 9,-17 C9,-12 6,-9 0,0 Z'

/** 라벨 pill 크기 계산용 근사값 (한글 한 글자가 대략 12px) */
const LABEL_CHAR_WIDTH = 12
const LABEL_PADDING = 18
const LABEL_HEIGHT = 22

interface MapPinProps {
  x: number
  y: number
  name: string
  /** 출제 순번. 바뀔 때마다 바운스 모션을 다시 재생하기 위한 key로 쓴다. */
  index: number
}

export function MapPin({ x, y, name, index }: MapPinProps) {
  const labelWidth = Math.max(44, name.length * LABEL_CHAR_WIDTH + LABEL_PADDING)

  // 라벨이 지도 좌우를 벗어나면 안쪽으로 밀어 넣는다.
  const half = labelWidth / 2
  const labelX = Math.min(MAP_WIDTH - half - 2, Math.max(half + 2, x))

  // 핀 몸통이 위로 26px 정도 올라가므로 기본은 그 위에 라벨을 둔다.
  // 지도 상단을 벗어나면 핀 아래쪽으로 뒤집어 배치한다.
  const placeAbove = y - 30 - LABEL_HEIGHT > 0
  const labelY = placeAbove
    ? y - 30 - LABEL_HEIGHT
    : Math.min(MAP_HEIGHT - LABEL_HEIGHT - 2, y + 10)

  return (
    // transform이 바뀌면 CSS transition이 핀을 새 위치로 날려 보낸다.
    // 이 <g>는 재마운트되면 안 되므로 key를 주지 않는다.
    <g className="map-pin" transform={`translate(${x}, ${y})`}>
      {/* 물결 — 핀 끝점 아래에서 하나만 퍼진다 */}
      <circle
        className="map-ripple"
        cx={0}
        cy={0}
        r={10}
        fill="none"
        stroke="var(--color-map-accent)"
        strokeWidth={1.5}
      />

      {/* 바닥 그림자 — 핀이 지도에 꽂혀 있는 느낌을 준다 */}
      <ellipse cx={0} cy={1.5} rx={5} ry={2} fill="#000" fillOpacity={0.35} />

      {/* index가 바뀌면 이 그룹만 재마운트되어 바운스 모션이 다시 실행된다 */}
      <g className="map-pin-body" key={index}>
        <path d={PIN_PATH} fill="var(--color-map-accent)" />
        {/* 핀 안쪽 구멍 */}
        <circle cx={0} cy={-17} r={3.6} fill="var(--color-map-bg)" />
      </g>

      {/* 라벨은 현재 대학 하나만 띄운다. 20개를 전부 띄우면 지도가 글자로 뒤덮인다. */}
      <g transform={`translate(${labelX - x}, ${labelY - y})`}>
        <rect
          x={-labelWidth / 2}
          y={0}
          width={labelWidth}
          height={LABEL_HEIGHT}
          rx={LABEL_HEIGHT / 2}
          fill="var(--color-map-bg)"
          fillOpacity={0.85}
          stroke="var(--color-map-accent)"
          strokeOpacity={0.4}
          strokeWidth={1}
        />
        <text
          x={0}
          y={LABEL_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          fill="var(--color-map-accent)"
        >
          {name}
        </text>
      </g>
    </g>
  )
}

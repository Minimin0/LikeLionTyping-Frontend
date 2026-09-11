/**
 * 현재 목표 대학에 꽂히는 지도 핀 + 이름 라벨 + 물결 애니메이션.
 *
 * 이 컴포넌트는 원점(0,0)을 기준으로 그린다. 위치 이동과 확대 역보정은
 * 부모가 transform으로 처리한다. 항상 다른 레이어 위에 와야 하므로 마지막에 렌더링한다.
 */

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
/** 핀 몸통 높이보다 위에 라벨을 둔다 */
const LABEL_OFFSET_Y = -56

interface MapPinProps {
  name: string
  /** 출제 순번. 바뀔 때마다 바운스 모션을 다시 재생하기 위한 key로 쓴다. */
  index: number
}

export function MapPin({ name, index }: MapPinProps) {
  const labelWidth = Math.max(44, name.length * LABEL_CHAR_WIDTH + LABEL_PADDING)

  return (
    <g>
      {/* 물결 — 핀 끝점 아래에서 하나만 퍼진다 */}
      <circle
        className="map-ripple"
        r={10}
        fill="none"
        stroke="var(--color-map-accent)"
        strokeWidth={1.5}
      />

      {/* 바닥 그림자 — 핀이 지도에 꽂혀 있는 느낌을 준다 */}
      <ellipse cy={1.5} rx={5} ry={2} fill="#000" fillOpacity={0.35} />

      {/* index가 바뀌면 이 그룹만 재마운트되어 바운스 모션이 다시 실행된다 */}
      <g className="map-pin-body" key={index}>
        <path d={PIN_PATH} fill="var(--color-map-accent)" />
        {/* 핀 안쪽 구멍 */}
        <circle cy={-17} r={3.6} fill="var(--color-map-bg)" />
      </g>

      {/* 라벨은 현재 대학 하나만 띄운다. 20개를 전부 띄우면 지도가 글자로 뒤덮인다. */}
      <g transform={`translate(0, ${LABEL_OFFSET_Y})`}>
        <rect
          x={-labelWidth / 2}
          width={labelWidth}
          height={LABEL_HEIGHT}
          rx={LABEL_HEIGHT / 2}
          fill="var(--color-map-bg)"
          fillOpacity={0.88}
          stroke="var(--color-map-accent)"
          strokeOpacity={0.45}
          strokeWidth={1}
        />
        <text
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

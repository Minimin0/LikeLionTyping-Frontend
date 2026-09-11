/**
 * 지도 연출 테스트.
 * 좌표를 못 찾는 경우에도 게임이 멈추지 않는지를 특히 신경 써서 확인한다.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KoreaMap } from './KoreaMap'

const NAMES = ['성결대', '서울대', '제주대']

function renderMap(currentIndex: number, progress: number, names: string[] = NAMES) {
  return render(<KoreaMap names={names} currentIndex={currentIndex} progress={progress} />)
}

describe('KoreaMap', () => {
  it('현재 대학 이름을 핀 라벨로 띄운다', () => {
    renderMap(0, 0)
    expect(screen.getByText('성결대')).toBeInTheDocument()
  })

  it('현재 순번이 바뀌면 라벨도 따라간다', () => {
    renderMap(2, 0)
    expect(screen.getByText('제주대')).toBeInTheDocument()
  })

  it('멀리 이동해 축소된 상태에서는 주변 대학 라벨을 띄우지 않는다', () => {
    // 성결대 → 제주대는 아주 먼 이동이라 배율이 낮아진다.
    // 전국 뷰에서 서울 27개 라벨이 전부 뜨면 화면이 글자로 뒤덮인다.
    renderMap(1, 0, ['성결대', '제주대', '서울대'])

    expect(screen.getByText('제주대')).toBeInTheDocument()
    expect(screen.queryByText('서울대')).not.toBeInTheDocument()
  })

  it('크게 확대된 상태에서는 주변 대학 라벨이 함께 보인다', () => {
    // 첫 항목은 기본 배율(3.5)로 시작하므로 라벨 표시 기준을 넘는다.
    renderMap(0, 0, ['성결대', '서울대'])
    expect(screen.getByText('서울대')).toBeInTheDocument()
  })

  it('외부 이미지나 타일 서버를 부르지 않고 순수 SVG로만 그린다', () => {
    const { container } = renderMap(1, 0.5)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('image')).toBeNull()
  })

  it('진행률에 따라 현재 구간 선의 끝점이 이동한다', () => {
    const { container: atStart } = renderMap(1, 0)
    const { container: atEnd } = renderMap(1, 1)

    const startLine = atStart.querySelector('line')
    const endLine = atEnd.querySelector('line')

    expect(startLine).not.toBeNull()
    expect(endLine).not.toBeNull()
    // 진행률 0이면 출발점에 붙어 있고, 1이면 도착점까지 뻗는다
    expect(startLine?.getAttribute('x2')).not.toBe(endLine?.getAttribute('x2'))
  })

  it('첫 번째 항목에서는 이전 지점이 없어 구간 선을 그리지 않는다', () => {
    const { container } = renderMap(0, 0.5)
    expect(container.querySelector('line')).toBeNull()
  })
})

describe('KoreaMap — 좌표 없는 대학 방어', () => {
  const WITH_UNKNOWN = ['성결대', '알수없는대학교', '제주대']

  it('좌표가 없는 이름이 와도 크래시하지 않는다', () => {
    expect(() => renderMap(1, 0.5, WITH_UNKNOWN)).not.toThrow()
  })

  it('좌표가 없는 항목이 현재 목표여도 지도만 비고 화면은 유지된다', () => {
    const { container } = renderMap(1, 0.5, WITH_UNKNOWN)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.queryByText('알수없는대학교')).not.toBeInTheDocument()
  })

  it('전부 좌표가 없어도 렌더링된다', () => {
    expect(() => renderMap(0, 0, ['없는대1', '없는대2'])).not.toThrow()
  })
})

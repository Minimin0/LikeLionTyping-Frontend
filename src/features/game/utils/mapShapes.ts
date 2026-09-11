/**
 * 국토 외곽선을 SVG로 그릴 수 있는 형태로 미리 계산해 둔다.
 *
 * 외곽선은 절대 바뀌지 않는 상수이므로 모듈 로드 시 한 번만 계산한다.
 * 본지도와 미니맵이 같은 결과를 재사용해서 path 문자열을 두 번 만들지 않는다.
 */
import {
  JEJU_CENTER,
  JEJU_RADIUS_LAT,
  JEJU_RADIUS_LON,
  KOREA_MAINLAND,
} from '../constants/koreaOutline'
import { project, toSmoothClosedPath } from './mapProjection'

export const MAINLAND_PATH = toSmoothClosedPath(KOREA_MAINLAND.map(project))

// 제주도는 타원 하나로 충분하다. 중심과 반지름 모두 같은 project()를 통과시켜야
// 본토·마커와 위치가 어긋나지 않는다.
const jejuCenter = project(JEJU_CENTER)
const jejuEdge = project([JEJU_CENTER[0] + JEJU_RADIUS_LON, JEJU_CENTER[1] - JEJU_RADIUS_LAT])

export const JEJU_ELLIPSE = {
  cx: jejuCenter.x,
  cy: jejuCenter.y,
  rx: Math.abs(jejuEdge.x - jejuCenter.x),
  ry: Math.abs(jejuEdge.y - jejuCenter.y),
}

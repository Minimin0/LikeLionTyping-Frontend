/**
 * MSW Mock 핸들러가 카테고리별로 올바른 출제 항목을 내려주는지 검증한다.
 * 백엔드 연동 후에는 이 테스트도 함께 제거된다.
 */
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { startGame } from './gameApi'
import { gameHandlers, resetMockGameState } from './gameHandlers'

const server = setupServer(...gameHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
// Mock 이용권은 개수가 정해져 있어 초기화하지 않으면 뒤쪽 테스트가 소진 상태로 실행된다.
beforeEach(() => resetMockGameState())

describe('POST /api/game-sessions', () => {
  it('CH.01은 문장 5개를 순서대로 내려준다', async () => {
    const session = await startGame({ participantId: 1, categoryId: 1 })

    expect(session.category.code).toBe('CH01')
    expect(session.sentences).toHaveLength(5)
    expect(session.sentences[0].content).toBe('안녕하세요 저희는 성결대 멋사 입니다')
    expect(session.sentences.map((item) => item.sequence)).toEqual([1, 2, 3, 4, 5])
  })

  it('CH.02는 해커톤 소개 문장 5개를 순서대로 내려준다', async () => {
    const session = await startGame({ participantId: 1, categoryId: 2 })

    expect(session.sentences).toHaveLength(5)
    expect(session.sentences[0].content).toBe('멋사에는 약 80개의 대학이 참여합니다')
  })

  it('다시 시작해도 문장 순서가 바뀌지 않는다 — 백엔드가 준 순서 그대로다', async () => {
    const first = await startGame({ participantId: 1, categoryId: 2 })
    const second = await startGame({ participantId: 1, categoryId: 2 })

    expect(first.sentences).toEqual(second.sentences)
  })

  it('CH.03은 축제 문장 5개를 순서대로 내려준다', async () => {
    const session = await startGame({ participantId: 1, categoryId: 3 })

    expect(session.sentences).toHaveLength(5)
    expect(session.sentences[0].content).toBe('축제의 밤은 언제나 짧고 반짝인다.')
  })
})

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

  it('CH.02는 대학 20개를 내려주고 첫 번째는 항상 성결대다', async () => {
    const session = await startGame({ participantId: 1, categoryId: 2 })

    expect(session.sentences).toHaveLength(20)
    expect(session.sentences[0].content).toBe('성결대')
    expect(new Set(session.sentences.map((item) => item.content)).size).toBe(20)
  })

  it('CH.02를 다시 시작하면 2번째 이후 대학이 달라진다', async () => {
    const first = await startGame({ participantId: 1, categoryId: 2 })
    const second = await startGame({ participantId: 1, categoryId: 2 })

    const toKey = (s: typeof first) => s.sentences.map((item) => item.content).join('|')
    expect(toKey(first)).not.toBe(toKey(second))
    // 첫 번째만은 항상 고정이다
    expect(first.sentences[0].content).toBe(second.sentences[0].content)
  })

  it('CH.03은 기존 문장 5개가 유지된다', async () => {
    const session = await startGame({ participantId: 1, categoryId: 3 })

    expect(session.sentences).toHaveLength(5)
    expect(session.sentences[0].content).toBe('지금부터 축제 라디오 방송을 시작하겠습니다')
  })
})

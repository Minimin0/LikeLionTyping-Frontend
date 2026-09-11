/**
 * 운영 확정 문장이 요청한 표기와 완전히 일치하는지 고정한다.
 * 타자 게임이라 띄어쓰기·쉼표·마침표·느낌표 하나만 달라도 다음 문장으로 넘어가지 않으므로,
 * 누군가 무심코 "통일"해버리는 것을 이 테스트가 막는다.
 */
import { describe, expect, it } from 'vitest'

import { MOCK_CATEGORIES, MOCK_SENTENCES } from './mockSentences'

describe('MOCK_SENTENCES — 운영 확정본', () => {
  it('세 카테고리 모두 문장이 있다', () => {
    for (const category of MOCK_CATEGORIES) {
      expect(MOCK_SENTENCES[category.code], category.code).toBeDefined()
    }
  })

  it('sequence가 1부터 순서대로 매겨져 있다', () => {
    for (const [code, sentences] of Object.entries(MOCK_SENTENCES)) {
      expect(
        sentences.map((item) => item.sequence),
        code,
      ).toEqual(sentences.map((_, index) => index + 1))
    }
  })

  it('CH.01 문장이 확정본과 글자 하나까지 일치한다', () => {
    expect(MOCK_SENTENCES.CH01.map((item) => item.content)).toEqual([
      '안녕하세요 저희는 성결대 멋사 입니다',
      '프론트엔드, 백엔드, 기획디자인 세 개의 부서가 있습니다',
      '상상을 현실로 만드는 개발동아리 입니다',
      '함께 공부하고 발전할 수 있습니다',
      '저희의 아기사자가 되어주세요!',
    ])
  })

  it('CH.02 문장이 확정본과 글자 하나까지 일치한다', () => {
    expect(MOCK_SENTENCES.CH02.map((item) => item.content)).toEqual([
      '멋사에는 약 80개의 대학이 참여합니다',
      '대표적인 활동으로는 해커톤이 있습니다',
      '해커톤은 제한된 시간동안 집중적으로 기획, 개발하는 대회입니다',
      '협력하는 방법을 키울 수 있습니다',
      '저희의 아기사자가 되어주세요!',
    ])
  })

  it('CH.03 문장이 확정본과 글자 하나까지 일치한다', () => {
    expect(MOCK_SENTENCES.CH03.map((item) => item.content)).toEqual([
      '축제의 밤은 언제나 짧고 반짝인다.',
      '스피커가 울리면 모두 같은 편이 된다.',
      '조명이 꺼져도 노래는 남는다.',
      '오늘의 무대는 우리 모두의 것이다.',
      '마지막 곡까지 함께 달려보자.',
    ])
  })

  it('마침표는 CH.03에만 있다 — 의도된 표기이므로 통일하면 안 된다', () => {
    const endsWithPeriod = (code: string) =>
      MOCK_SENTENCES[code].every((item) => item.content.endsWith('.'))
    const hasNoPeriod = (code: string) =>
      MOCK_SENTENCES[code].every((item) => !item.content.endsWith('.'))

    expect(hasNoPeriod('CH01')).toBe(true)
    expect(hasNoPeriod('CH02')).toBe(true)
    expect(endsWithPeriod('CH03')).toBe(true)
  })
})

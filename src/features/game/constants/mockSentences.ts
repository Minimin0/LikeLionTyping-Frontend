/**
 * 게임 문장 / 카테고리 Mock 데이터.
 * 운영 확정 문장 (2026.09 기준). 카테고리당 5문장.
 *
 * TODO: 백엔드 연동 시 교체
 *  - MOCK_CATEGORIES → GET /api/categories 응답
 *  - MOCK_SENTENCES  → POST /api/game-sessions 응답의 sentences
 *
 * 문장은 아래 표기 그대로 쓴다. 타자 게임이라 띄어쓰기·쉼표·마침표·느낌표가
 * 한 글자만 달라도 다음 문장으로 넘어가지 않는다.
 * CH.01 / CH.02에는 마침표가 없고 CH.03에만 있는데, 의도된 것이니 통일하지 마라.
 *
 * 문장 내용은 또 바뀔 수 있으므로 반드시 이 파일에서만 관리한다.
 * 컴포넌트나 훅에서 문장을 직접 만들거나 셔플하지 마라. (Backend 순서를 그대로 쓴다)
 */
import type { CategoryDto, SentenceDto } from '../types/game.types'

export const MOCK_CATEGORIES: CategoryDto[] = [
  { id: 1, code: 'CH01', name: 'CH.01 성결 멋사 ON AIR' },
  { id: 2, code: 'CH02', name: 'CH.02 캠퍼스 주파수' },
  { id: 3, code: 'CH03', name: 'CH.03 페스티벌 라디오' },
]

export const MOCK_SENTENCES: Record<string, SentenceDto[]> = {
  // CH.01 성결 멋사 ON AIR — 성결대 멋사 소개
  CH01: [
    { sequence: 1, content: '안녕하세요 저희는 성결대 멋사 입니다' },
    { sequence: 2, content: '프론트엔드, 백엔드, 기획디자인 세 개의 부서가 있습니다' },
    { sequence: 3, content: '상상을 현실로 만드는 개발동아리 입니다' },
    { sequence: 4, content: '함께 공부하고 발전할 수 있습니다' },
    { sequence: 5, content: '저희의 아기사자가 되어주세요!' },
  ],

  // CH.02 캠퍼스 주파수 — 전국 멋사와 해커톤 소개
  CH02: [
    { sequence: 1, content: '멋사에는 약 80개의 대학이 참여합니다' },
    { sequence: 2, content: '대표적인 활동으로는 해커톤이 있습니다' },
    { sequence: 3, content: '해커톤은 제한된 시간동안 집중적으로 기획, 개발하는 대회입니다' },
    { sequence: 4, content: '협력하는 방법을 키울 수 있습니다' },
    { sequence: 5, content: '저희의 아기사자가 되어주세요!' },
  ],

  // CH.03 페스티벌 라디오 — 축제 현장
  CH03: [
    { sequence: 1, content: '축제의 밤은 언제나 짧고 반짝인다.' },
    { sequence: 2, content: '스피커가 울리면 모두 같은 편이 된다.' },
    { sequence: 3, content: '조명이 꺼져도 노래는 남는다.' },
    { sequence: 4, content: '오늘의 무대는 우리 모두의 것이다.' },
    { sequence: 5, content: '마지막 곡까지 함께 달려보자.' },
  ],
}

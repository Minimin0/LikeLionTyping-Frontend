/**
 * 게임 문장 / 카테고리 Mock 데이터.
 *
 * TODO: 백엔드 연동 시 교체
 *  - MOCK_CATEGORIES → GET /api/categories 응답
 *  - MOCK_SENTENCES  → POST /api/game-sessions 응답의 sentences
 *
 * 문장 내용은 축제 전까지 계속 바뀔 수 있으므로 반드시 이 파일에서만 관리한다.
 * 컴포넌트나 훅에서 문장을 직접 만들거나 셔플하지 마라. (Backend 순서를 그대로 쓴다)
 *
 * CH.02는 문장이 아니라 대학 이름 20개를 랜덤 출제하므로 여기에 없다.
 * constants/universities.ts와 MSW 핸들러를 참고.
 */
import type { CategoryDto, SentenceDto } from '../types/game.types'

export const MOCK_CATEGORIES: CategoryDto[] = [
  { id: 1, code: 'CH01', name: 'CH.01 성결 멋사 ON AIR' },
  { id: 2, code: 'CH02', name: 'CH.02 캠퍼스 주파수' },
  { id: 3, code: 'CH03', name: 'CH.03 페스티벌 라디오' },
]

export const MOCK_SENTENCES: Record<string, SentenceDto[]> = {
  // CH.01 성결 멋사 ON AIR — 성결대 멋쟁이사자처럼 소개
  CH01: [
    { sequence: 1, content: '안녕하세요 저희는 성결대 멋사 입니다' },
    { sequence: 2, content: '프론트엔드, 백엔드, 기획디자인 세 개의 부서가 있습니다' },
    { sequence: 3, content: '상상을 현실로 만드는 개발동아리 입니다' },
    { sequence: 4, content: '함께 공부하고 발전할 수 있습니다' },
    { sequence: 5, content: '저희의 아기사자가 되어주세요!' },
  ],

  // CH.03 페스티벌 라디오 — DJ 멘트, 신청곡, 축제 현장
  CH03: [
    { sequence: 1, content: '지금부터 축제 라디오 방송을 시작하겠습니다' },
    { sequence: 2, content: '오늘의 첫 신청곡은 청춘에게 보내는 노래입니다' },
    { sequence: 3, content: '부스 앞 스피커에서 익숙한 멜로디가 흘러나옵니다' },
    { sequence: 4, content: '가을 바람과 함께 여러분의 사연을 기다립니다' },
    { sequence: 5, content: '다음 곡이 끝나기 전에 마지막 문장을 입력해 주세요' },
  ],
}

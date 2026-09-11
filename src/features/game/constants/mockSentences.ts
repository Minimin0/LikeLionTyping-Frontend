/**
 * 게임 문장 / 카테고리 Mock 데이터.
 *
 * TODO: 백엔드 연동 시 교체
 *  - MOCK_CATEGORIES → GET /api/categories 응답
 *  - MOCK_SENTENCES  → POST /api/game-sessions 응답의 sentences
 *
 * 문장 내용은 축제 전까지 계속 바뀔 수 있으므로 반드시 이 파일에서만 관리한다.
 * 컴포넌트나 훅에서 문장을 직접 만들거나 셔플하지 마라. (Backend 순서를 그대로 쓴다)
 */
import type { CategoryDto, SentenceDto } from '../types/game.types'

export const MOCK_CATEGORIES: CategoryDto[] = [
  { id: 1, code: 'CH01', name: 'CH.01 성결 멋사 ON AIR' },
  { id: 2, code: 'CH02', name: 'CH.02 캠퍼스 주파수' },
  { id: 3, code: 'CH03', name: 'CH.03 페스티벌 라디오' },
]

export const MOCK_SENTENCES: Record<string, SentenceDto[]> = {
  // CH.01 성결 멋사 ON AIR — 교내 멋사 소개, 동아리 활동, 개발 일상
  CH01: [
    { sequence: 1, content: '성결대학교 멋쟁이사자처럼에 오신 것을 환영합니다' },
    { sequence: 2, content: '오늘도 우리는 한 줄의 코드로 세상을 바꿉니다' },
    { sequence: 3, content: '회의실 불빛 아래에서 밤새 기획서를 다듬었습니다' },
    { sequence: 4, content: '첫 커밋을 올리던 순간의 설렘을 기억하시나요' },
    { sequence: 5, content: '함께 만든 서비스가 드디어 세상에 공개됩니다' },
  ],

  // CH.02 캠퍼스 주파수 — 교외 멋사 참여 대학, 연합 활동
  CH02: [
    { sequence: 1, content: '전국의 멋쟁이사자처럼 대학들이 한자리에 모였습니다' },
    { sequence: 2, content: '다른 학교 친구들과 밤새 아이디어를 나누었습니다' },
    { sequence: 3, content: '연합 해커톤에서 만난 팀원들이 든든한 동료가 되었습니다' },
    { sequence: 4, content: '학교는 달라도 우리는 같은 꿈을 꾸고 있습니다' },
    { sequence: 5, content: '캠퍼스마다 다른 주파수가 하나의 방송으로 이어집니다' },
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

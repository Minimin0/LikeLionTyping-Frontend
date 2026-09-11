/**
 * 게임 진행 관련 상수 모음.
 * 축제 현장에서 수치를 조정할 일이 생기면 이 파일만 고치면 되도록 모아둔다.
 */

/** 게임 시작 전 카운트다운 초. 이 값이 0이 되는 순간부터 시간 측정이 시작된다. */
export const COUNTDOWN_SECONDS = 3

/**
 * 임시 참가자 ID.
 * TODO: 백엔드 연동 시 교체 — FE2의 POST /api/participants/identify 응답에서 받은
 * participantId로 대체한다. (게임 화면은 participantId를 직접 만들지 않는다)
 */
export const MOCK_PARTICIPANT_ID = 1

/**
 * Mock 이용권 개수.
 * 실제 PlayPass 보유 여부는 Backend가 판단하므로 이 값은 Mock 서버 흉내용일 뿐이다.
 * 개발 중에는 새로고침하면 다시 이 개수로 초기화된다.
 */
export const MOCK_INITIAL_PASS_COUNT = 3

/**
 * 채널 선택 화면에 보여줄 설명 문구와 미리보기 문장.
 * API DTO(CategoryDto)에는 설명 필드가 없어 프론트 표시용 문구로만 관리한다.
 * TODO: 백엔드가 description을 내려주게 되면 이 상수를 제거하고 응답 값을 쓴다.
 */
export const CHANNEL_PRESENTATION: Record<string, { description: string; preview: string }> = {
  CH01: {
    description: '성결대 멋쟁이사자처럼을 소개하는 채널입니다',
    preview: '안녕하세요 저희는 성결대 멋사 입니다',
  },
  CH02: {
    description: '전국 80개 멋쟁이사자처럼 대학의 이름을 입력하는 채널입니다',
    preview: '성결대',
  },
  CH03: {
    description: 'DJ 멘트와 신청곡이 오가는 축제 현장 생방송',
    preview: '오늘의 첫 신청곡은 청춘에게 보내는 노래입니다',
  },
}

/**
 * CH.02에서 출제할 대학 개수.
 * 카테고리마다 항목 개수가 다르므로(CH01 5개 / CH02 20개 / CH03 5개)
 * 화면에서는 이 값이 아니라 항상 API 응답 sentences 배열의 길이를 쓴다.
 */
export const CH02_ITEM_COUNT = 20

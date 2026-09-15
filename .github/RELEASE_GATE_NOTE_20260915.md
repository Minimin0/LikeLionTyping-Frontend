# Frontend Release Gate — 2026-09-15

이 브랜치는 최종 릴리스 직전 범위 고정용 수정만 포함합니다.

## 변경
- 참가자 화면 상단 네비게이션에서 운영자 진입 링크 제거
- 운영자는 `/admin` 경로로 직접 접근

## 비변경
- API 계약
- 라우트 구조
- 세션/새로고침 복구
- 완료 복구
- 게임 로직
- 랭킹 로직
- Admin 기능 범위

## 병합 전 확인
- `npm run lint`
- `npm test`
- `npm run build`
- 실제 Backend E2E
- 행사 PC에서 1920px / 1280px 육안 확인

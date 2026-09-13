# LikeLionTyping Frontend

React, Vite, TypeScript 기반 멋쟁이 타자처럼 Frontend입니다.

## 2026-09-15 Final Release

2026-09-13 회의에서 최종 Frontend 통합 방향을 확정했습니다.

- 기준선: 현재 Production 검증이 끝난 `develop`
- 최종 UI: 라디오 / ON AIR 스타일
- PR #3, #4, #5는 통째로 merge하지 않고 필요한 기능/UI만 최신 `develop`에 이식
- Game UX: 자모 단위 표시, 오타 표시, 실시간 타수, 자동 포커스, 진행률, 3초 카운트다운, 타이핑 연출 모두 반영
- 기존 `sessionStorage`, refresh recovery, completion recovery, 실제 Backend API 구조는 유지
- Primary QA viewport: 1920px / 1280px
- 최종 Release 목표: 2026-09-15

상세 기준: [docs/FINAL_RELEASE_FRONTEND_2026-09-13.md](docs/FINAL_RELEASE_FRONTEND_2026-09-13.md)

> 아래 Current Routes는 현재 `develop`에 실제 구현된 상태입니다. 최종 통합에서는 `/` Landing + `/participate` 참가자 식별 구조로 정리하는 것이 확정되어 있습니다.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

개발 Backend 기본값은 `VITE_API_BASE_URL=http://localhost:8080/api`입니다. 실제 `.env`와 secret은 commit하지 않습니다.

Production에서는 same-origin `/api`를 사용하며 Mock runtime에 의존하지 않습니다.

## Verify

```bash
npm run lint
npm test
npm run build
E2E_ADMIN_PASSWORD='<local test password>' npm run e2e:api
```

API E2E는 실행 중인 Backend와 테스트 데이터가 필요합니다. Production content를 Frontend에서 생성하거나 수정하지 않습니다.

## Current Routes

- `/`: 참가자 식별
- `/categories`: 카테고리 선택
- `/game/:categoryId`: 게임 시작, 카운트다운, 타이핑, 완료
- `/result/:gameSessionId`: 완료 또는 recovery 결과
- `/rankings`: 카테고리 랭킹
- `/admin`: 관리자 로그인, 참가자 검색, PAID 발급, 무효화/복구

## Target Routes for 9/15 Release

- `/`: Landing
- `/participate`: 참가자 식별
- `/categories`: 카테고리 선택
- `/game/:categoryId`: 게임
- `/result/:gameSessionId`: 결과 / completion recovery
- `/rankings`: 카테고리 탭형 공개 랭킹
- `/admin`: 관리자

참가자 화면에서는 Admin 진입 버튼을 제거하고 운영자는 `/admin`으로 직접 접근합니다.

## Release Scope

Admin UI는 실제 Backend가 지원하는 로그인 / 참가자 조회 / PAID 발급 / 경기 무효화+이용권 복구까지만 노출합니다.

Production runtime의 Mock Category/Sentence/Participant/Ranking/GameSession은 사용하지 않으며 MSW/fixture는 테스트 환경에서만 허용합니다.

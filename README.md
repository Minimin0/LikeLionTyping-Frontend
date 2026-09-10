# LikeLionTyping Frontend

React, Vite, TypeScript 기반 멋쟁이 타자처럼 Frontend입니다.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

개발 Backend 기본값은 `VITE_API_BASE_URL=http://localhost:8080/api`입니다. 실제 `.env`와 secret은 commit하지 않습니다.

## Verify

```bash
npm run lint
npm test
npm run build
E2E_ADMIN_PASSWORD='<local test password>' npm run e2e:api
```

API E2E는 실행 중인 Backend와 테스트 전용 Category 3개/Sentence 15개가 필요합니다. Production content를 만들거나 변경하지 않습니다.

## Routes

- `/`: 참가자 식별
- `/categories`: 카테고리 선택
- `/game/:categoryId`: 게임 시작, 카운트다운, 타이핑, 완료
- `/result/:gameSessionId`: 완료 또는 recovery 결과
- `/rankings`: 카테고리 랭킹
- `/admin`: 관리자 로그인, 참가자 검색, PAID 발급, 무효화/복구

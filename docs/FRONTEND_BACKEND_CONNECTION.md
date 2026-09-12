# 프론트엔드와 백엔드 연결 안내

이 문서는 참가자 식별과 공개 랭킹 화면을 연습용 API에서 실제 Spring Boot API로 전환하는 방법을 설명한다.

## 1. 실행 환경 설정

개발 PC에서 프론트와 백엔드가 서로 다른 포트로 실행될 때 `.env`를 아래처럼 설정한다.

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
API_PROXY_TARGET=http://localhost:8080
```

`VITE_API_BASE_URL`은 프론트 코드가 사용하는 공통 API 경로다. Vite 개발 서버는 `/api` 요청을 `API_PROXY_TARGET`으로 전달한다. 배포 환경에서는 Nginx가 같은 역할을 하므로 `VITE_API_BASE_URL=/api`를 유지한다.

설정을 바꾼 뒤에는 실행 중인 개발 서버를 종료하고 `npm run dev`로 다시 시작한다.

## 2. 참가자 확인 연결

참가자 확인 화면은 `src/features/participant/api/participantApi.ts`의 `identifyParticipant` 함수를 사용한다.

```text
POST /api/participants/identify
{ nickname, phone }
```

전화번호는 화면에서 하이픈과 공백을 제거한 숫자만 전송한다. 성공 응답의 `participantId`, `nickname`, `isNewParticipant`, `availablePassCount`는 `src/features/participant/session/participantSession.ts`가 `sessionStorage`에 저장한다. 전화번호는 저장하지 않는다.

## 3. 공개 랭킹 연결

카테고리와 랭킹은 다음 파일이 요청한다.

| 역할 | 파일 | API |
| --- | --- | --- |
| 카테고리 조회 | `src/shared/api/categoryApi.ts` | `GET /api/categories` |
| 랭킹 조회 | `src/features/ranking/api/rankingApi.ts` | `GET /api/rankings?categoryId={id}` |

랭킹 화면은 `rank`, `nickname`, `elapsedMs`만 화면에 표시한다. 백엔드 응답에 다른 정보가 있어도 전화번호는 표시하지 않는다.

## 4. 게임 담당자와 연결할 부분

팀원 B가 만든 `src/features/game/constants/game.constants.ts`의 임시 `MOCK_PARTICIPANT_ID`는 병합 때 아래처럼 바꾼다.

```ts
import { getParticipantSession } from '@/features/participant/session/participantSession'

const participantId = getParticipantSession()?.participantId
```

참가자 정보가 없으면 게임을 시작시키지 말고 `/participate`로 이동시킨다. 게임 결과의 `랭킹 보기` 버튼은 `/ranking?categoryId={categoryId}`로 연결한다.

## 5. 운영자 화면 연결

메인 하단의 `운영진 화면` 버튼은 이미 `/admin`으로 연결되어 있다. 병합 시 `src/app/router/routes.tsx`의 `/admin` placeholder를 팀원 A의 `AdminPage`로 교체한다.

## 6. 실제 연결 확인 순서

1. `VITE_USE_MOCK=false`로 바꾸고 프론트와 백엔드를 모두 실행한다.
2. 신규 전화번호로 참가 확인을 한다.
3. 동일 전화번호와 다른 닉네임으로 확인해 `NICKNAME_MISMATCH` 안내를 확인한다.
4. 게임을 완료한 뒤 공개 랭킹에서 카테고리별 기록을 확인한다.
5. 공개 랭킹과 브라우저 저장소에 전화번호가 없는지 확인한다.


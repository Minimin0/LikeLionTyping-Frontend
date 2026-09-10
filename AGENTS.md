# 멋쟁이 타자처럼
## Frontend Technical Contract v1.0

**기준 문서:** 최종 고정 개발 기획서 v1.0  
**Frontend:** 3명  
**Backend:** Java + Spring Boot + MySQL  
**운영:** AWS EC2 + Nginx  
**Feature Freeze:** 2026.09.15  
**운영 목표:** 2026.09.19

이 문서는 프론트엔드에서 **기술 선택, 폴더 구조, API 호출 방식, 게임 상태, 에러 처리 방식이 개발자마다 달라지는 것을 방지하기 위한 공통 개발 계약**이다.

---

# 1. Frontend 기술 스택 최종 고정안

기획서에서 React + Vite SPA 구조가 최종 결정되어 있으며, FE1은 Game Core, FE2는 Participant Flow/API Integration, FE3는 UI/Ranking/Admin을 담당하도록 정의되어 있다.

| 영역 | 최종 기술 | 역할 |
|---|---|---|
| Language | **TypeScript** | API DTO 및 상태 타입 안정성 |
| Framework | **React** | SPA UI |
| Build Tool | **Vite** | 개발 서버 / 빌드 |
| Routing | **React Router DOM** | Participant / Game / Ranking / Admin 라우팅 |
| Server State | **TanStack Query** | API Query / Mutation / Cache |
| HTTP Client | **Axios** | Spring Boot API 통신 |
| Game State | **useReducer + React State** | Game State Machine |
| Styling | **Tailwind CSS** | UI 스타일 통일 |
| Form | **React Hook Form** | 참가자/Admin 입력 |
| Validation | **Zod** | 클라이언트 입력 검증 |
| Mock API | **MSW** | Backend 미완성 API Mock |
| Unit Test | **Vitest** | 함수·Game Core 테스트 |
| Component Test | **React Testing Library** | UI 동작 테스트 |
| Lint | **ESLint** | 코드 품질 |
| Format | **Prettier** | 스타일 통일 |

### 상태관리 원칙

이번 서비스에서는 Redux나 대형 전역 상태 관리 라이브러리는 사용하지 않는다.

서버 데이터는 `TanStack Query`, 게임 진행 상태는 `useReducer`, 화면 단위 UI 상태는 `useState`로 처리한다.

즉,

```text
Backend Data
    ↓
TanStack Query

Game State
    ↓
useReducer

Local UI State
    ↓
useState
```

구조로 고정한다.

---

# 2. Frontend 프로젝트 구조

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── App.tsx
│
├── features/
│   ├── participant/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── pages/
│   │
│   ├── category/
│   ├── game/
│   ├── ranking/
│   └── admin/
│
├── shared/
│   ├── api/
│   │   ├── apiClient.ts
│   │   └── apiError.ts
│   │
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── types/
│   └── utils/
│
├── styles/
│
├── main.tsx
└── vite-env.d.ts
```

핵심은 **기능 단위 Feature 구조**다.

예를 들어 게임 관련 코드가 `components`, `hooks`, `api` 등에 흩어지는 것이 아니라:

```text
features/game/
```

안에서 관리한다.

---

# 3. 화면 책임 구조

기획서의 FE Owner 기준을 그대로 따른다.

| 담당 | 책임 |
|---|---|
| FE1 | Game Core |
| FE2 | Participant Flow / API Integration |
| FE3 | UI / Ranking / Admin |

### FE1 — Game Core

담당 범위:

```text
COUNTDOWN
Typing
IME
Enter
오타 처리
Timer
Progress
Complete
```

특히 게임은 아래 State Machine을 반드시 사용한다.

```text
READY
  ↓
COUNTDOWN
  ↓
PLAYING
  ↓
SUBMITTING
  ↓
RESULT
```

---

# 4. Game Core 절대 규칙

게임 시간 측정은:

```ts
performance.now()
```

기준으로 한다.

`Date.now()`를 게임 기록 측정용으로 사용하지 않는다.

시작 순간:

```ts
const startTime = performance.now();
```

완료 순간:

```ts
const endTime = performance.now();

const elapsedMs = Math.round(endTime - startTime);
```

형태로 계산한다.

Backend로 보내는 공식 시간 데이터는:

```json
{
  "elapsedMs": 43821
}
```

처럼 **정수 millisecond**다.

기록 DB는 `elapsed_ms BIGINT`를 공식 기준으로 사용하며

```text
43.821초 = 43821ms
```

형태로 저장한다.

---

# 5. 한글 IME 처리

이 부분은 일반 타자 게임보다 중요하다.

한글 입력 도중 Enter 이벤트가 발생했다고 해서 다음 문장으로 넘어가면 안 된다.

반드시:

```text
compositionstart
    ↓
isComposing = true

compositionend
    ↓
isComposing = false
```

를 관리한다.

Enter 처리 조건은:

```text
isComposing === false
AND
input === sentence
```

일 때만 허용한다.

즉:

```ts
if (
  event.key === "Enter" &&
  !isComposing &&
  input === currentSentence
) {
  nextSentence();
}
```

구조를 기본으로 한다.

---

# 6. Frontend ↔ Backend API Contract v1

API 기본 Prefix:

```text
/api
```

운영 구조:

```text
React
  ↓
Nginx
  ↓
/api/*
  ↓
Spring Boot
  ↓
MySQL
```

---

# 7. API 01. 참가자 식별

```http
POST /api/participants/identify
```

### Request

```json
{
  "nickname": "타자왕",
  "phone": "01012345678"
}
```

### Response

```json
{
  "participantId": 1,
  "nickname": "타자왕",
  "isNewParticipant": true,
  "availablePassCount": 1
}
```

### 역할

신규 참가자:

```text
Participant 생성
+
FREE PlayPass 1회
```

기존 참가자:

```text
기존 Participant 반환
```

전화번호가 같은데 다른 닉네임이면:

```http
409 Conflict
```

```json
{
  "code": "NICKNAME_MISMATCH"
}
```

프론트 UI:

```text
이미 등록된 전화번호입니다.
기존 닉네임으로 다시 입력해주세요.
```

전화번호 하나당 닉네임 하나이며 닉네임 변경을 허용하지 않는다.

---

# 8. API 02. 카테고리 조회

```http
GET /api/categories
```

### Response 예시

```json
[
  {
    "id": 1,
    "code": "CH01",
    "name": "카테고리명"
  },
  {
    "id": 2,
    "code": "CH02",
    "name": "카테고리명"
  },
  {
    "id": 3,
    "code": "CH03",
    "name": "카테고리명"
  }
]
```

카테고리는 프론트에 하드코딩하지 않는다.

Backend 응답을 사용한다.

기획서 기준:

```text
CH01
CH02
CH03
```

3개 카테고리를 운영한다.

---

# 9. API 03. 게임 시작

```http
POST /api/game-sessions
```

### Request

권장 계약:

```json
{
  "participantId": 1,
  "categoryId": 2
}
```

### Backend 처리

```text
Participant 확인
        ↓
AVAILABLE PlayPass 확인
        ↓
PlayPass 소비
        ↓
GameSession 생성
        ↓
IN_PROGRESS
        ↓
카테고리 문장 5개 반환
```

### Response

```json
{
  "gameSessionId": 21,
  "category": {
    "id": 2,
    "code": "CH02",
    "name": "카테고리명"
  },
  "sentences": [
    {
      "sequence": 1,
      "content": "첫 번째 문장"
    },
    {
      "sequence": 2,
      "content": "두 번째 문장"
    },
    {
      "sequence": 3,
      "content": "세 번째 문장"
    },
    {
      "sequence": 4,
      "content": "네 번째 문장"
    },
    {
      "sequence": 5,
      "content": "다섯 번째 문장"
    }
  ]
}
```

문장은 프론트에서 작성하거나 Random 처리하지 않는다.

**Backend가 전달한 순서 그대로 사용한다.**

모든 참가자는 카테고리별 동일 문장 + 동일 순서를 사용한다.

---

# 10. 게임 시작 실패

사용 가능한 PlayPass가 없으면:

```http
409 Conflict
```

```json
{
  "code": "NO_AVAILABLE_PASS"
}
```

Frontend:

```text
재도전은 운영진에게 문의해주세요.
결제 확인 후 다시 참가할 수 있습니다.
```

화면으로 전환한다.

중요한 점은 프론트에서:

```ts
if (availablePassCount > 0) {
   // 게임 허용
}
```

만으로 게임 가능 여부를 확정하면 안 된다는 것이다.

최종 판단은 항상:

```text
POST /api/game-sessions
```

에 대한 Backend 응답이다.

---

# 11. API 04. 게임 완료

```http
POST /api/game-sessions/{gameSessionId}/complete
```

### Request

```json
{
  "elapsedMs": 43821
}
```

### Response

```json
{
  "elapsedMs": 43821,
  "personalBestMs": 43821,
  "personalBest": true,
  "rank": 3
}
```

Frontend가 계산하는 값:

```text
elapsedMs
```

Backend가 계산하는 값:

```text
공식 기록 인정 여부
개인 최고 기록
Personal Best 여부
현재 Rank
Ranking 포함 여부
```

이다.

프론트에서는 절대로:

```ts
if (newRecord < oldRecord)
```

같은 로직으로 공식 PB를 결정하지 않는다.

---

# 12. Complete 중복 요청

사용자가 완료 버튼을 여러 번 누르거나 네트워크 재전송이 발생할 수 있다.

Frontend에서는:

```text
PLAYING
→ SUBMITTING
```

으로 바뀌는 순간 완료 Mutation 버튼을 비활성화한다.

```ts
if (state === "SUBMITTING") {
  return;
}
```

하지만 **Frontend 방어만 신뢰하지 않는다.**

Backend가 GameSession 상태를 다시 검증한다.

이미 완료됐거나 무효화된 Session이면:

```http
409 Conflict
```

```json
{
  "code": "INVALID_GAME_STATE"
}
```

를 사용한다.

---

# 13. API 05. Ranking

```http
GET /api/rankings?categoryId={categoryId}
```

예:

```http
GET /api/rankings?categoryId=2
```

### Response

```json
[
  {
    "rank": 1,
    "nickname": "사자왕",
    "elapsedMs": 36120
  },
  {
    "rank": 2,
    "nickname": "타자왕",
    "elapsedMs": 38990
  },
  {
    "rank": 3,
    "nickname": "코딩사자",
    "elapsedMs": 43821
  }
]
```

Frontend에서는:

```text
rank
nickname
elapsedMs
```

만 표시한다.

**전화번호는 절대 Ranking 화면에 존재하면 안 된다.**

카테고리별 독립 랭킹이며 동일 참가자의 여러 게임 중 가장 빠른 `COMPLETED` 기록 하나만 랭킹에 반영된다.

---

# 14. API 06. Admin Login

```http
POST /api/admin/login
```

### Request

```json
{
  "password": "관리자 입력값"
}
```

### Response

기획서에서는 구체 인증 전달 방식을 `관리자 세션/토큰` 수준까지 고정하고 있다.

따라서 프론트에서는 인증 처리를 반드시:

```text
features/admin/auth
```

또는

```text
shared/api/adminAuth
```

안에 캡슐화한다.

React 코드에 관리자 실제 비밀번호를:

```ts
const ADMIN_PASSWORD = "1234";
```

같이 저장하는 것은 절대 금지다.

관리자 비밀번호/비밀값은 서버 환경변수 + Spring Security에서 검증한다.

**통합 전에 BE와 딱 하나 확인해야 할 항목은 Admin 인증이 Bearer Token인지 HttpOnly Session Cookie인지다.**

UI 컴포넌트에서는 이 차이를 알 필요가 없도록 API Layer에서 처리한다.

---

# 15. API 07. Admin 참가자 조회

```http
GET /api/admin/participants?phone={phone}
```

예:

```http
GET /api/admin/participants?phone=01012345678
```

응답에는 Admin에서 운영에 필요한:

```text
Participant
PlayPass
GameSession
```

정보가 포함된다.

Admin 화면에서는 이를 통해:

```text
무료 사용 여부
남은 이용권
경기 기록
경기 상태
```

를 확인한다.

---

# 16. API 08. PAID 이용권 발급

```http
POST /api/admin/participants/{participantId}/passes
```

### 역할

운영진이:

```text
500원 결제 확인
```

후 호출한다.

결과:

```text
PAID
AVAILABLE
```

상태의 PlayPass 1개 생성.

Frontend에서는 절대로 참가자 화면에서 이 API를 호출하면 안 된다.

```text
/admin
```

에서만 접근한다.

재도전 횟수에는 제한이 없지만 **결제 1회 → PlayPass 1회 → 게임 1회** 구조다.

---

# 17. API 09. 경기 무효 처리

```http
POST /api/admin/game-sessions/{gameSessionId}/invalidate
```

운영진이 시스템 오류 경기 등을 처리할 때 사용한다.

필요한 경우:

```json
{
  "restorePass": true
}
```

와 같은 형태로 복구 여부를 전달하도록 BE/FE DTO를 맞춘다.

Backend에서는:

```text
GameSession INVALIDATED
+
PlayPass AVAILABLE 복구
```

를 **하나의 Transaction으로 처리해야 한다.**

이 작업을 Frontend에서 두 API로 나눠 호출하면 안 된다.

---

# 18. 공통 API Error 규격

Frontend는 HTTP Status의 숫자만 보고 UI를 결정하지 말고 **`code`를 기준으로 처리**한다.

권장 통합 포맷은:

```json
{
  "code": "NO_AVAILABLE_PASS",
  "message": "사용 가능한 이용권이 없습니다."
}
```

이다.

프론트에서 최소한 아래 코드에 대한 분기 처리가 필요하다.

| HTTP | code | Frontend |
|---:|---|---|
| 409 | `NICKNAME_MISMATCH` | 기존 닉네임 입력 안내 |
| 409 | `NO_AVAILABLE_PASS` | 운영진 결제 안내 |
| 409 | `INVALID_GAME_STATE` | 중복 제출 중지 / 기록 상태 확인 |
| 401 | Admin 인증 오류 | 로그인 이동 |
| 403 | Admin 권한 오류 | Admin 접근 차단 |

---

# 19. Axios 공통 Client

컴포넌트에서 직접:

```ts
axios.get(...)
```

하지 않는다.

공통 Client 하나를 사용한다.

```ts
// shared/api/apiClient.ts

import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

환경변수:

```env
VITE_API_BASE_URL=/api
```

운영 환경에서는 Nginx가:

```text
/api/*
```

를 Spring Boot로 전달한다.

---

# 20. TanStack Query Key 규칙

Query Key도 통일한다.

```ts
["categories"]

["ranking", categoryId]

["admin", "participant", phone]
```

Mutation은:

```text
identifyParticipant
startGame
completeGame
adminLogin
issuePass
invalidateGame
```

형태로 naming한다.

API 요청 함수와 UI 컴포넌트를 분리한다.

```text
Component
    ↓
Custom Hook
    ↓
API Function
    ↓
Axios
    ↓
Backend
```

구조로 통일한다.

---

# 21. Frontend가 절대로 결정하면 안 되는 것

이 부분은 이번 프로젝트에서 가장 중요하다.

```text
무료 플레이 가능 여부
PlayPass 사용 가능 여부
공식 기록 인정 여부
개인 최고 기록
현재 순위
랭킹 포함 여부
PAID 이용권 유효성
GameSession 공식 상태
```

전부 **Backend Authority**다.

Frontend는:

> 서버가 내려준 상태를 보여주는 역할

만 한다.

---

# 22. FE별 API 담당

| 담당 | 주요 API |
|---|---|
| FE1 Game Core | `POST /game-sessions`, `POST /game-sessions/{id}/complete` |
| FE2 Flow / Integration | `POST /participants/identify`, `GET /categories`, 게임 API 연동 |
| FE3 UI / Ranking / Admin | `GET /rankings`, `/api/admin/*` |

하지만 실제 API 함수는 공용 Feature API Layer에 두기 때문에 **같은 API를 각자 다시 작성하지 않는다.**

---

# 23. Mock 개발 규칙

Backend API가 아직 연결되지 않아도 프론트 개발을 중지하지 않는다.

Backend가 완성되지 않은 기능은 고정 API 계약을 기준으로 Mock Data로 먼저 구현한다.

따라서 Mock Response도 실제 API와 완전히 동일한 타입을 사용한다.

```text
Mock
↓
TypeScript DTO
↑
Real API
```

이 구조를 유지한다.

API 연결할 때 컴포넌트 코드를 다시 뜯어고치는 상황이 없어야 한다.

---

# 24. 가장 중요한 Failure QA

단순히 정상 플레이만 되면 완료가 아니다.

| 상황 | 기대 결과 |
|---|---|
| 시작 버튼 연타 | Session / Pass 중복 생성 X |
| 완료 요청 연타 | 기록 중복 저장 X |
| 게임 중 새로고침 | IN_PROGRESS 상태 보존 |
| 게임 중 뒤로가기 | 미완료 기록 Ranking 포함 X |
| 인터넷 순간 단절 | 중복 기록 없이 복구 |
| Admin 발급 연타 | PAID Pass 의도치 않은 중복 생성 X |
| 서버 재시작 | DB 기록 유지 |

---

# 25. 현재 API 계약에서 반드시 짚고 넘어갈 1개

기획서에는:

> 완료 API 실패 시 기록이 저장됐는지 불명확한 상태를 만들지 않도록 재조회 흐름을 둔다.

라고 되어 있는데, 현재 API Contract 표에는 **GameSession 결과 조회 API가 별도로 정의되어 있지 않다.**

따라서 통합 전에 Backend와 아래 둘 중 하나를 확정하는 것이 좋다.

### 권장안

```http
GET /api/game-sessions/{gameSessionId}
```

응답:

```json
{
  "gameSessionId": 21,
  "status": "COMPLETED",
  "elapsedMs": 43821,
  "personalBestMs": 43821,
  "personalBest": true,
  "rank": 3
}
```

그러면:

```text
POST complete
      ↓
네트워크 Timeout
      ↓
GET game-session
      ↓
COMPLETED?
      ↓
YES → RESULT
NO → 재시도/오류 처리
```

가 가능하다.

이건 새로운 서비스 기능을 추가하자는 의미가 아니라, **기획서가 이미 요구하고 있는 "저장 여부 불명확 상태 방지"를 실제 구현 가능하게 만드는 API 보완**이다.

---

# 26. 프론트 개발 완료 기준

Frontend에서 단순히 "화면 나옴"은 Done이 아니다.

```text
신규 참가자
↓
FREE 이용권
↓
카테고리 선택
↓
GameSession 생성
↓
3초 Countdown
↓
5문장 정확 입력
↓
완료
↓
기록 저장
↓
PB
↓
Ranking
```

이 흐름이 실제 Backend까지 연결되어야 한다.

그리고 기존 참가자는:

```text
Identify
↓
FREE 없음
↓
Admin PAID 발급
↓
재도전
↓
Pass 소비
↓
재사용 차단
```

까지 확인되어야 한다.

---

# 27. 팀 공통 요약

## Frontend 고정 기술 스택

```text
React
Vite
TypeScript
React Router
TanStack Query
Axios
React useReducer
React Hook Form
Zod
Tailwind CSS
MSW
Vitest
React Testing Library
ESLint
Prettier
```

## 게임 상태

```text
READY
→ COUNTDOWN
→ PLAYING
→ SUBMITTING
→ RESULT
```

## 공식 API

```text
POST /api/participants/identify

GET  /api/categories

POST /api/game-sessions

POST /api/game-sessions/{id}/complete

GET  /api/rankings?categoryId={id}

POST /api/admin/login

GET  /api/admin/participants?phone={phone}

POST /api/admin/participants/{id}/passes

POST /api/admin/game-sessions/{id}/invalidate
```

그리고 팀 전원이 하나만 기억하면 된다.

> **Frontend는 게임 UX와 시간 측정을 담당하지만, 이용권·공식 기록·PB·랭킹·게임 상태의 최종 결정권은 Backend에 있다.**

각자 화면이나 API를 완성하는 것이 목표가 아니라,
네 명이 만든 결과물이 현장에서 하나의 서비스로 안정적으로 동작하게 만드는 것이 목표다.

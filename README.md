# LikeLionTyping Frontend

React + Vite 기반 멋쟁이 타자처럼 Frontend입니다.

## Links

- Project Hub: https://github.com/Minimin0/LikeLionTyping
- Backend: https://github.com/Minimin0/LikeLionTyping-Backend

## Technology

- React
- Vite
- REST API 연동

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment

`.env.example`을 참고해 로컬 `.env`를 만듭니다.

```text
VITE_API_BASE_URL=http://localhost:8080
```

실제 `.env`는 Git에 commit하지 않습니다.

## Routes

| Path | 설명 |
| --- | --- |
| `/` | 랜딩 화면. ON AIR 부팅 로딩 화면 이후 운영진 버튼 노출 |
| `/admin` | 운영진 콘솔. 로그인 없이 바로 진입 (실제 인증은 백엔드 연동 후 추가 예정) |
| `/play` | 참가자 화면 (아직 미구현, 준비 중 placeholder) |

## Structure

```text
src/
├── api/
├── components/
├── features/
│   ├── participant/
│   ├── category/
│   ├── game/
│   ├── ranking/
│   └── admin/
├── pages/
├── routes/
├── styles/
└── utils/
```

## Responsibilities

- 메인 화면
- 참가자 정보 입력
- 카테고리 선택
- 타자 게임
- 3초 Countdown
- 한글 IME 입력 처리
- 오타 표시
- 문장 진행 상태
- `performance.now()` 기반 게임 시간 측정
- 결과 화면
- 랭킹
- 운영자 Admin UI

## Branch

`main`은 운영 기준 브랜치, `develop`은 통합 개발 브랜치입니다.
기능 개발은 `feat/*`, 버그 수정은 `fix/*`, 설정/문서 작업은 `chore/*`에서 진행합니다.

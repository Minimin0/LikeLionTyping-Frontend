# Frontend Final Release Decisions — 2026-09-13

최종 통합/Release 목표: **2026-09-15**  
기준 브랜치: **develop**

> 이 문서는 9/15 Frontend Release 범위의 최종 결정사항이다. `AGENTS.md`의 기술 계약은 유지하되, 기존 PR 설명/Mock 전제/임시 route와 충돌하는 Release 범위는 이 문서를 우선한다. 문서에 적힌 Target UI/Route는 최종 통합 전까지 실제 코드와 다를 수 있다.

## 1. 통합 원칙

- 최신 `develop`을 기준선으로 사용한다.
- PR #3, #4, #5를 통째로 merge하지 않는다.
- 각 PR에서 필요한 기능/UI만 최신 `develop` 기반 새 브랜치에 이식한다.
- 현재 Production에서 검증된 실제 Backend API, `sessionStorage`, refresh recovery, completion recovery, duplicate submission 방어는 유지한다.

## 2. 최종 UI

- 라디오 / ON AIR 스타일을 최종 디자인으로 사용한다.
- Landing 포함 사용자 화면은 기획디자인팀 전달 UI를 시각 기준으로 사용한다.
- 1920px / 1280px 행사 PC를 Primary QA viewport로 한다.

## 3. Game Core — 모두 반영

PR #4에서 아래 UX를 모두 가져온다.

- 한글 자모 단위 입력 표시
- 오타 위치 표시
- 실시간 타수
- 자동 포커스 복구
- 진행률 표시
- 3초 카운트다운
- 타이핑 화면 연출

공식 완료 API에는 기존 계약대로 정수 `elapsedMs`만 전달한다. 타수는 UI 표시용이다.

## 4. Target Routes

```text
/                         Landing
/participate              참가자 식별
/categories               카테고리 선택
/game/:categoryId          게임
/result/:gameSessionId     결과 / completion recovery
/rankings                  공개 랭킹
/admin                     관리자
```

- Result는 Game 내부 상태가 아니라 별도 route로 유지한다.
- 참가자 화면의 Admin 버튼은 제거한다.
- 운영자는 `/admin`에 직접 접근한다.

## 5. Participant / Ranking

- 참가자 입력 오류를 명확하게 안내한다.
- 새로고침 후 참가자 정보/진행 상태 유지 기능을 보존한다.
- Ranking은 select 대신 카테고리 탭/버튼 UI를 사용한다.
- Ranking, PB, FREE/PAID 판단을 Frontend에서 계산하지 않는다.

## 6. Admin Release 범위

Frontend Admin UI는 실제 Backend가 지원하는 아래 기능만 노출한다.

1. 관리자 로그인
2. 전화번호 또는 닉네임 기반 참가자 조회
3. PAID 이용권 발급
4. GameSession 무효화 + 이용권 복구

이번 Release에서 노출하지 않는다.

- 전화번호/닉네임 수정
- 참가자 삭제
- 기록/순위 직접 수정
- 환불/취소
- standalone pass restore
- 등록 마감 토글
- 콘텐츠 수정

## 7. Production Mock 금지

Production runtime에서 Mock Category/Sentence/Participant/Ranking/GameSession을 사용하지 않는다.

MSW/fixture는 테스트 환경에서만 유지한다.

Backend Production DB가 카테고리/문장 Source of Truth이다.

## 8. 담당별 핵심 이식

### Admin 담당
- 참가자 조회
- PAID 발급
- 경기 무효화 + 이용권 복구

### Participant / Ranking 담당
- 잘못된 입력 오류 안내
- 새로고침 후 참가자 정보 유지
- 카테고리별 Ranking

### Game Core 담당
- 자모 단위 표시
- 오타 위치 표시
- 실시간 타수
- 자동 포커스 / 진행률 / 카운트다운 / 타이핑 연출

## 9. Done 기준

최종 통합 PR은 최소 아래를 통과해야 한다.

- `npm run lint`
- `npm test`
- `npm run build`
- 실제 Backend E2E
- Korean IME composition / Enter
- 오타 수정 / Backspace
- rapid start / rapid complete
- refresh / browser back
- completion recovery
- network failure
- participant session 유지
- category ranking
- FREE / PAID / NO_AVAILABLE_PASS
- NICKNAME_MISMATCH

## 10. Freeze / 일정

- 09/14: 최신 `develop` 기준 UI/기능 이식 및 통합 PR
- 09/15: 전체 QA, 최종 통합, Release
- 09/15 이후: 신규 기능 추가 금지. P0/P1 버그, 보안, 운영 QA만 처리
- 09/16~09/18: Domain/HTTPS/CORS/행사 PC/Admin 운영 리허설
- 09/19: 행사 운영

## 11. Frontend 권한 경계

Frontend는 UX와 시간 측정을 담당한다.

아래는 Backend Authority이며 Frontend가 임의로 결정하지 않는다.

- FREE 가능 여부
- PAID 이용권 유효성
- GameSession 공식 상태
- 공식 기록 인정 여부
- Personal Best
- Ranking

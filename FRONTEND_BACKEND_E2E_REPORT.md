# Frontend ↔ Backend E2E Report

검증일: 2026-09-10 (Asia/Seoul)

## Repository State

- Frontend: `Minimin0/LikeLionTyping-Frontend`, `feat/api-integration` (base `origin/develop` `9324015`)
- Backend: `Minimin0/LikeLionTyping-Backend`, `develop` `e632e9294dbc8a88778074fe9e9eeda55c620e78`
- Backend source 변경: 없음
- Frontend production secret/content 추가: 없음

## Backend Contract

| Method | Path                                       | Request                       | Response                                                                         | 주요 오류                                                                                                            | 인증   |
| ------ | ------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ |
| POST   | `/api/participants/identify`               | `nickname`, `phone`           | `participantId`, `nickname`, `isNewParticipant`, `availablePassCount`            | `VALIDATION_ERROR`, `NICKNAME_MISMATCH`                                                                              | Public |
| GET    | `/api/categories`                          | 없음                          | `Category[]`                                                                     | 없음                                                                                                                 | Public |
| POST   | `/api/game-sessions`                       | `participantId`, `categoryId` | `gameSessionId`, `category`, ordered `sentences`                                 | `PARTICIPANT_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `NO_AVAILABLE_PASS`, `ACTIVE_GAME_EXISTS`, `SENTENCE_CONTENT_INVALID` | Public |
| POST   | `/api/game-sessions/{id}/complete`         | `elapsedMs`                   | `gameSessionId`, `status`, `elapsedMs`, `personalBestMs`, `personalBest`, `rank` | `GAME_SESSION_NOT_FOUND`, `INVALID_GAME_STATE`, `INVALID_ELAPSED_TIME`                                               | Public |
| GET    | `/api/game-sessions/{id}`                  | 없음                          | `GameResult`                                                                     | `GAME_SESSION_NOT_FOUND`                                                                                             | Public |
| GET    | `/api/rankings?categoryId={id}`            | `categoryId`                  | `rank`, `nickname`, `elapsedMs`                                                  | `CATEGORY_NOT_FOUND`                                                                                                 | Public |
| POST   | `/api/admin/login`                         | `password`                    | `token`, `expiresAt`                                                             | `ADMIN_UNAUTHORIZED`                                                                                                 | Public |
| GET    | `/api/admin/participants?phone=...`        | `phone`                       | participant, pass, session details                                               | `PARTICIPANT_NOT_FOUND`, 401/403                                                                                     | Bearer |
| POST   | `/api/admin/participants/{id}/passes`      | 없음                          | PAID `PlayPass`                                                                  | `PARTICIPANT_NOT_FOUND`, 401/403                                                                                     | Bearer |
| POST   | `/api/admin/game-sessions/{id}/invalidate` | `restorePass`                 | invalidated session/pass state                                                   | `GAME_SESSION_NOT_FOUND`, `INVALID_GAME_STATE`, 401/403                                                              | Bearer |

## API Mapping

| Frontend                      | Backend                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| Participant Screen            | `POST /api/participants/identify`                                        |
| Category Screen               | `GET /api/categories`                                                    |
| Game Start                    | `POST /api/game-sessions`                                                |
| Game Complete                 | `POST /api/game-sessions/{id}/complete`                                  |
| Result / uncertain completion | complete response, then `GET /api/game-sessions/{id}` recovery           |
| Ranking                       | `GET /api/rankings?categoryId={id}`                                      |
| Admin Login                   | `POST /api/admin/login`                                                  |
| Admin Search                  | `GET /api/admin/participants?phone=...`                                  |
| Paid Retry                    | `POST /api/admin/participants/{id}/passes`                               |
| Equipment Error Recovery      | `POST /api/admin/game-sessions/{id}/invalidate` with `restorePass: true` |

Participant and active game state use `sessionStorage`; phone does not. Admin token is React memory state only. `gameSessionId`, ordered sentences, progress, and `performance.timeOrigin + performance.now()` start time survive reload without using `Date.now()` for the official elapsed time.

## Environment

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- API base: `VITE_API_BASE_URL=http://localhost:8080/api`
- DB: isolated local MySQL `8.0.46`, port `3307`, test-only database
- Content: local fixture `CH01`-`CH03`, exactly 5 sentences each; not committed
- Admin password/hash/token secret: local process environment only; not committed
- CORS: `http://localhost:5173` allowed and verified by preflight

## Scenario Results

| Scenario                            | Result | Executed verification                                                          |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------ |
| A New participant through ranking   | PASS   | FREE 1, 3 categories, 5 sentences, complete, result, ranking                   |
| B Existing participant without pass | PASS   | available 0, `409 NO_AVAILABLE_PASS`                                           |
| C Nickname mismatch                 | PASS   | same phone/different nickname, `409 NICKNAME_MISMATCH`                         |
| D PAID retry                        | PASS   | Admin login/search/issue, new game, complete                                   |
| E Personal best                     | PASS   | 5000ms first, 7000ms slower, 3000ms faster; PB and ranking verified            |
| F Completion uncertainty            | PASS   | completed POST response treated as lost, recovery GET returned official result |
| G Equipment error                   | PASS   | start, Admin search, invalidate + restore, replay, complete                    |

`npm run e2e:api`: 9/9 checks PASS (A-G, CORS, token expiry).

## Failure QA

| Check                  | Result | Evidence                                                                                         |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Start rapid click      | PASS   | Browser double-click; DB: participant 1, FREE pass 1, CH01 session 1                             |
| Enter rapid press      | PASS   | Browser and unit test; no sentence skip/newline after root fix                                   |
| Complete rapid press   | PASS   | reducer submission lock test plus Backend concurrent-complete integration test                   |
| Back navigation        | PASS   | active server session and client game state retained                                             |
| Refresh                | PASS   | `gameSessionId`, sentences, index, performance-based start retained                              |
| API timeout            | PASS   | 20-second local delayed endpoint; 8-second Axios timeout showed safe connection guidance         |
| Backend down           | PASS   | stopped Backend; browser showed connection guidance without losing active state                  |
| Admin token expiry     | PASS   | actual short-lived token returned 403; UI returned to Admin login                                |
| Empty ranking          | PASS   | empty API response and accessible empty state verified                                           |
| Fewer than 5 sentences | PASS   | MySQL fixture temporarily reduced to 4; Backend `409 SENTENCE_CONTENT_INVALID`; fixture restored |
| No pass                | PASS   | Scenario B                                                                                       |
| Duplicate PAID click   | PASS   | Browser double-click disabled during request; Backend returned one idempotent AVAILABLE pass     |
| Korean IME guard       | PASS   | composition state + `nativeEvent.isComposing`; automated exact-match test                        |

## Contract Mismatches

- P1: An expired/invalid Admin Bearer token returns Spring Security's default `403` body without the common `{ code, message, timestamp, path }` envelope. `docs/FRONTEND_INTEGRATION.md` explicitly directs the client to handle 401/403, so integration is not blocked; the Frontend clears in-memory auth by status. A later Backend hardening PR should normalize this response if the blanket error-envelope statement in `docs/API.md` is intended to cover security-filter failures.

## Frontend Issues

- P0: NONE
- P1: Browser E2E is currently manual; add CI automation once the team selects its MySQL/Testcontainers workflow.
- P2: NONE

## Backend Issues

- P0: NONE
- P1: Normalize expired/invalid Bearer 403 responses to the documented error envelope.
- P2: NONE

## Security And Privacy

- Public ranking and recovery responses were scanned and contained no phone number.
- Phone remains only in identify/Admin search form scope and Backend Admin response.
- Admin token is never persisted to local/session storage.
- Repository scan found no committed password, token secret, datasource password, or production URL.

## Build And Test Results

- Frontend `npm run lint`: PASS
- Frontend `npm test`: 3 files, 5 tests, 0 failed, 0 skipped
- Frontend `npm run build`: PASS, includes `tsc --noEmit`
- Backend `./gradlew clean test build`: PASS, 11 tests
- MySQL API/browser E2E: PASS
- Flyway fresh migration and restart validation on MySQL 8.0.46: PASS
- Hibernate `ddl-auto=validate`: PASS

## Remaining Production Inputs

- Confirmed Category 3
- Confirmed Sentence 15
- Production DB credentials
- `ADMIN_PASSWORD_HASH`
- `ADMIN_TOKEN_SECRET`
- Production CORS origin
- DNS / HTTPS certificate

No production input was invented or committed during E2E.

## Integration Status

READY

All integration completion checks pass. The remaining P1 items do not block Frontend review or Frontend-to-Backend integration.

import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const base = (process.env.E2E_API_URL || 'http://localhost:8080/api').replace(/\/$/, '')
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const stateFile = process.env.E2E_STATE_FILE
if (!adminPassword) throw new Error('E2E_ADMIN_PASSWORD is required')

const call = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json()
  if (!response.ok)
    throw Object.assign(new Error(body.code || response.statusText), {
      status: response.status,
      body,
    })
  return body
}
const post = (path, body, token) =>
  call(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
const get = (path, token) =>
  call(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
const start = (participantId, categoryId) => post('/game-sessions', { participantId, categoryId })
const complete = (id, elapsedMs) => post(`/game-sessions/${id}/complete`, { elapsedMs })
const playState = (participantId) => get(`/participants/${participantId}/play-state`)
const issue = (token, participantId, quantity = 1) =>
  post(`/admin/participants/${participantId}/passes`, { quantity }, token)
const invalidate = (token, gameSessionId, restorePass) =>
  post(`/admin/game-sessions/${gameSessionId}/invalidate`, {
    reason: restorePass ? 'e2e restore' : 'e2e no restore',
    restorePass,
  }, token)
const login = async () => (await post('/admin/login', { password: adminPassword })).token
const pass = (name) => console.log(`${name} PASS`)

if (process.env.E2E_VERIFY_EXISTING === '1') {
  if (!stateFile || !existsSync(stateFile)) throw new Error('E2E_STATE_FILE is required for persisted verification')
  const state = JSON.parse(readFileSync(stateFile, 'utf8'))
  const token = await login()
  const participant = await get(`/admin/participants?phone=${state.phone}`, token)
  assert.equal(participant.id, state.participantId)
  assert.ok(participant.payments.some((payment) => payment.amountKrw === 1000))
  const ranking = await get(`/rankings?categoryId=${state.categoryId}`)
  assert.ok(ranking.some((row) => row.nickname === state.nickname && row.elapsedMs === 4200))
  pass('SCENARIO K')
  process.exit(0)
}

const seed = String(Date.now()).slice(-8)
const phone = `010${seed}`
const nickname = `A-${seed}`
const categories = await get('/categories')
const [ch01, ch02, ch03] = categories
assert.deepEqual(categories.map((category) => category.code), ['CH01', 'CH02', 'CH03'])

const participant = await post('/participants/identify', { nickname, phone })
assert.equal(participant.availablePassCount, 1)
const freeGame = await start(participant.participantId, ch01.id)
assert.equal(freeGame.sentences.length, 5)
assert.equal(freeGame.passConsumed, true)
assert.equal(freeGame.resumedExisting, false)
assert.equal(freeGame.availablePassCount, 0)
const resumedFreeGame = await start(participant.participantId, ch01.id)
assert.equal(resumedFreeGame.gameSessionId, freeGame.gameSessionId)
assert.equal(resumedFreeGame.passConsumed, false)
assert.equal(resumedFreeGame.resumedExisting, true)
assert.equal(resumedFreeGame.availablePassCount, 0)
const activeState = await playState(participant.participantId)
assert.equal(activeState.availablePassCount, 0)
assert.equal(activeState.activeGame.gameSessionId, freeGame.gameSessionId)
assert.equal(activeState.activeGame.categoryId, ch01.id)
assert.equal((await complete(freeGame.gameSessionId, 6000)).status, 'COMPLETED')
const noActiveState = await playState(participant.participantId)
assert.equal(noActiveState.availablePassCount, 0)
assert.equal(noActiveState.activeGame, null)
await assert.rejects(
  () => start(participant.participantId, ch01.id),
  (error) => error.status === 409 && error.body.code === 'NO_AVAILABLE_PASS',
)
assert.ok((await get(`/rankings?categoryId=${ch01.id}`)).some((row) => row.nickname === nickname))
pass('SCENARIO A')

const token = await login()
const [found] = await get(`/admin/participants?query=${nickname}`, token)
assert.equal(found.id, participant.participantId)
pass('SCENARIO B')

const beforeIssue = await get(`/admin/participants?phone=${phone}`, token)
const issued = await issue(token, participant.participantId, 2)
assert.equal(issued.quantity, 2)
assert.equal(issued.amountKrw, 1000)
assert.equal(issued.availablePaidPassCount, beforeIssue.summary.availablePaidPassCount + 2)
assert.equal((await playState(participant.participantId)).availablePassCount, 2)
const afterIssue = await get(`/admin/participants?phone=${phone}`, token)
assert.equal(afterIssue.summary.availablePaidPassCount, beforeIssue.summary.availablePaidPassCount + 2)
pass('SCENARIO C')

const paidGame = await start(participant.participantId, ch02.id)
assert.equal(paidGame.passConsumed, true)
assert.equal(paidGame.resumedExisting, false)
assert.equal(paidGame.availablePassCount, 1)
await complete(paidGame.gameSessionId, 5500)
const afterPaidGame = await get(`/admin/participants?phone=${phone}`, token)
assert.equal(afterPaidGame.summary.availablePaidPassCount, afterIssue.summary.availablePaidPassCount - 1)
pass('SCENARIO D')

assert.ok(afterPaidGame.payments.some((payment) => payment.amountKrw === 1000 && payment.quantity === 2))
pass('SCENARIO E')

const dashboard = await get('/admin/dashboard', token)
assert.ok(dashboard.totalPaymentAmountKrw >= 1000)
assert.ok(dashboard.paidPlayCount >= 1)
assert.ok(dashboard.completedGameCount >= 2)
pass('SCENARIO F')

await issue(token, participant.participantId)
const noRestoreGame = await start(participant.participantId, ch03.id)
await complete(noRestoreGame.gameSessionId, 8000)
const beforeNoRestore = await get(`/admin/participants?phone=${phone}`, token)
const noRestore = await invalidate(token, noRestoreGame.gameSessionId, false)
assert.equal(noRestore.gameSessionStatus, 'INVALIDATED')
assert.equal(noRestore.playPassStatus, 'CONSUMED')
const afterNoRestore = await get(`/admin/participants?phone=${phone}`, token)
assert.equal(afterNoRestore.summary.availablePassCount, beforeNoRestore.summary.availablePassCount)
assert.ok(!(await get(`/rankings?categoryId=${ch03.id}`)).some((row) => row.nickname === nickname))
pass('SCENARIO G')

await issue(token, participant.participantId)
const restoreGame = await start(participant.participantId, ch03.id)
await complete(restoreGame.gameSessionId, 7000)
const beforeRestore = await get(`/admin/participants?phone=${phone}`, token)
const restored = await invalidate(token, restoreGame.gameSessionId, true)
assert.equal(restored.gameSessionStatus, 'INVALIDATED')
assert.equal(restored.playPassStatus, 'AVAILABLE')
const afterRestore = await get(`/admin/participants?phone=${phone}`, token)
assert.equal(afterRestore.summary.availablePassCount, beforeRestore.summary.availablePassCount + 1)
assert.ok(!(await get(`/rankings?categoryId=${ch03.id}`)).some((row) => row.nickname === nickname))
pass('SCENARIO H')

const fastGame = await start(participant.participantId, ch01.id)
await complete(fastGame.gameSessionId, 4200)
await issue(token, participant.participantId)
const slowGame = await start(participant.participantId, ch01.id)
await complete(slowGame.gameSessionId, 9000)
const ranking = await get(`/rankings?categoryId=${ch01.id}`)
const rows = ranking.filter((row) => row.nickname === nickname)
assert.equal(rows.length, 1)
assert.equal(rows[0].elapsedMs, 4200)
pass('SCENARIO I')

assert.ok(!JSON.stringify(ranking).includes(phone))
assert.ok(ranking.every((row) => !('phone' in row)))
pass('SCENARIO J')

if (stateFile) {
  writeFileSync(stateFile, JSON.stringify({
    phone,
    nickname,
    participantId: participant.participantId,
    categoryId: ch01.id,
  }))
}

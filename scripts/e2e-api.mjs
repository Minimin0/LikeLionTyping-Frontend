import assert from 'node:assert/strict'

const base = (process.env.E2E_API_URL || 'http://localhost:8080/api').replace(
  /\/$/,
  '',
)
const adminPassword = process.env.E2E_ADMIN_PASSWORD
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
  return { response, body }
}
const post = (path, body, token) =>
  call(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((value) => value.body)
const get = (path, token) =>
  call(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((value) => value.body)
const expectCode = async (promise, code) => {
  await assert.rejects(promise, (error) => error.body?.code === code)
}
const start = (participantId, categoryId) =>
  post('/game-sessions', { participantId, categoryId })
const complete = (id, elapsedMs) =>
  post(`/game-sessions/${id}/complete`, { elapsedMs })
const issue = (token, id, quantity = 1) => post(`/admin/participants/${id}/passes`, { quantity }, token)

const seed = String(Date.now()).slice(-7)
const phoneA = `010${seed}1`
const phoneE = `010${seed}2`
const reports = []
const pass = (name) => {
  reports.push(`${name} PASS`)
  console.log(`${name} PASS`)
}

const categories = await get('/categories')
assert.equal(categories.length, 3)
assert.ok(
  categories.every(({ code }) => ['CH01', 'CH02', 'CH03'].includes(code)),
)
assert.deepEqual(await get(`/rankings?categoryId=${categories[2].id}`), [])

const participantA = await post('/participants/identify', {
  nickname: `A-${seed}`,
  phone: phoneA,
})
assert.equal(participantA.availablePassCount, 1)
const gameA = await start(participantA.participantId, categories[0].id)
assert.equal(gameA.sentences.length, 5)
const resultA = await complete(gameA.gameSessionId, 6_000)
assert.equal(resultA.status, 'COMPLETED')
assert.ok(
  (await get(`/rankings?categoryId=${categories[0].id}`)).some(
    ({ nickname }) => nickname === participantA.nickname,
  ),
)
pass('SCENARIO A')

const existing = await post('/participants/identify', {
  nickname: participantA.nickname,
  phone: phoneA,
})
assert.equal(existing.availablePassCount, 0)
await expectCode(
  start(existing.participantId, categories[1].id),
  'NO_AVAILABLE_PASS',
)
pass('SCENARIO B')

await expectCode(
  post('/participants/identify', { nickname: 'wrong-name', phone: phoneA }),
  'NICKNAME_MISMATCH',
)
pass('SCENARIO C')

const login = await post('/admin/login', { password: adminPassword })
const [adminFound] = await get(`/admin/participants?query=${participantA.nickname}`, login.token)
assert.equal(adminFound.id, participantA.participantId)
const dashboardBefore = await get('/admin/dashboard', login.token)
const issuedTwo = await issue(login.token, participantA.participantId, 2)
assert.equal(issuedTwo.quantity, 2)
assert.equal(issuedTwo.amountKrw, 1000)
assert.equal(issuedTwo.availablePaidPassCount, 2)
const retry = await start(participantA.participantId, categories[1].id)
assert.equal((await complete(retry.gameSessionId, 5_500)).status, 'COMPLETED')
const afterOnePaid = await get(`/admin/participants?phone=${phoneA}`, login.token)
assert.equal(afterOnePaid.summary.availablePaidPassCount, 1)
assert.ok(afterOnePaid.payments.some(({ amountKrw }) => amountKrw === 1000))
const dashboardAfter = await get('/admin/dashboard', login.token)
assert.equal(dashboardAfter.totalPaymentAmountKrw, dashboardBefore.totalPaymentAmountKrw + 1000)
pass('SCENARIO D')

const participantE = await post('/participants/identify', {
  nickname: `E-${seed}`,
  phone: phoneE,
})
const first = await start(participantE.participantId, categories[0].id)
assert.equal((await complete(first.gameSessionId, 5_000)).personalBest, true)
await issue(login.token, participantE.participantId)
const slow = await start(participantE.participantId, categories[0].id)
const slowResult = await complete(slow.gameSessionId, 7_000)
assert.equal(slowResult.personalBest, false)
assert.equal(slowResult.personalBestMs, 5_000)
await issue(login.token, participantE.participantId)
const fast = await start(participantE.participantId, categories[0].id)
const fastResult = await complete(fast.gameSessionId, 3_000)
assert.equal(fastResult.personalBest, true)
assert.equal(fastResult.personalBestMs, 3_000)
pass('SCENARIO E')

await issue(login.token, participantA.participantId)
const uncertain = await start(participantA.participantId, categories[2].id)
await complete(uncertain.gameSessionId, 4_500)
const recovered = await get(`/game-sessions/${uncertain.gameSessionId}`)
assert.equal(recovered.status, 'COMPLETED')
assert.equal(recovered.elapsedMs, 4_500)
pass('SCENARIO F')

const paid1 = await issue(login.token, participantA.participantId)
const paid2 = await issue(login.token, participantA.participantId)
assert.equal(paid1.id, paid2.id)
const broken = await start(participantA.participantId, categories[0].id)
const before = await get(`/admin/participants?phone=${phoneA}`, login.token)
assert.ok(before.gameSessions.some(({ id }) => id === broken.gameSessionId))
const invalidated = await post(
  `/admin/game-sessions/${broken.gameSessionId}/invalidate`,
  { reason: 'e2e restore', restorePass: true },
  login.token,
)
assert.equal(invalidated.gameSessionStatus, 'INVALIDATED')
assert.equal(invalidated.playPassStatus, 'AVAILABLE')
const replay = await start(participantA.participantId, categories[0].id)
assert.notEqual(replay.gameSessionId, broken.gameSessionId)
await complete(replay.gameSessionId, 4_000)
await issue(login.token, participantA.participantId)
const noRestoreGame = await start(participantA.participantId, categories[0].id)
const noRestore = await post(
  `/admin/game-sessions/${noRestoreGame.gameSessionId}/invalidate`,
  { reason: 'e2e no restore', restorePass: false },
  login.token,
)
assert.equal(noRestore.gameSessionStatus, 'INVALIDATED')
assert.equal(noRestore.playPassStatus, 'CONSUMED')
pass('SCENARIO G')

const cors = await fetch(`${base}/categories`, {
  method: 'OPTIONS',
  headers: {
    Origin: 'http://localhost:5173',
    'Access-Control-Request-Method': 'GET',
  },
})
assert.equal(
  cors.headers.get('access-control-allow-origin'),
  'http://localhost:5173',
)
pass('CORS')

if (process.env.E2E_TOKEN_TTL_SECONDS) {
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      (Number(process.env.E2E_TOKEN_TTL_SECONDS) + 1) * 1_000,
    ),
  )
  await assert.rejects(
    get(`/admin/participants?query=${phoneA}`, login.token),
    (error) => [401, 403].includes(error.status),
  )
  pass('ADMIN TOKEN EXPIRY')
}

console.log(`\n${reports.length} checks passed against ${base}`)

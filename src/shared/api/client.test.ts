import type { AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, apiClient } from './client'

/** 네트워크 대신 정해진 응답을 돌려주는 어댑터. 인터셉터 체인은 그대로 탄다. */
const respondWith =
  (status: number, contentType: string, data: unknown): AxiosAdapter =>
  async (config) => ({
    data,
    status,
    statusText: 'OK',
    headers: { 'content-type': contentType },
    config,
  })

describe('apiClient 응답 형식 검증', () => {
  it('content-type이 text/html이면 데이터로 통과시키지 않고 reject한다', async () => {
    // 백엔드가 꺼져 SPA 폴백 index.html이 200으로 온 상황
    await expect(
      apiClient.get('/categories', {
        adapter: respondWith(
          200,
          'text/html; charset=utf-8',
          '<!doctype html>',
        ),
      }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('reject되는 에러는 code 기준 분기가 가능한 ApiError다', async () => {
    const error = await apiClient
      .get('/categories', { adapter: respondWith(200, 'text/html', '') })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
  })

  it('정상 JSON 응답은 그대로 통과한다', async () => {
    const response = await apiClient.get('/categories', {
      adapter: respondWith(200, 'application/json;charset=UTF-8', [{ id: 1 }]),
    })
    expect(response.data).toEqual([{ id: 1 }])
  })

  it('본문이 없는 204 응답은 content-type이 없어도 통과한다', async () => {
    const response = await apiClient.post('/x', null, {
      adapter: respondWith(204, '', ''),
    })
    expect(response.status).toBe(204)
  })
})

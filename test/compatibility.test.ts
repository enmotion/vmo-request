import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../index'
import LegacyRequest from './fixtures/legacy'

let mock: MockAdapter
beforeEach(() => { vi.useFakeTimers(); mock = new MockAdapter(axios) })
afterEach(() => { mock.restore(); vi.useRealTimers() })
async function settle<T>(promise: Promise<T>): Promise<T> {
  const result = promise.then(value => ({ value }), error => ({ error }))
  await vi.runAllTimersAsync()
  const outcome = await result
  if ('error' in outcome) throw outcome.error
  return outcome.value
}

for (const [name, Client] of [['legacy', LegacyRequest], ['current', VmoRequest]] as const) {
  for (const instance of [false, true]) {
    describe(`${name}, instance=${instance}`, () => {
      it('retains POST deduplication and the event-loop settlement window at TTL zero', async () => {
        mock.onPost('/post').reply(200, { ok: true })
        const client = new Client({}, instance)
        const first = await client.request({ url: '/post', method: 'post' })
        const second = client.request({ url: '/post', method: 'post' })
        expect(await settle(second)).toBe(first)
        expect(mock.history.post).toHaveLength(1)
        await settle(client.request({ url: '/post', method: 'post' }))
        expect(mock.history.post).toHaveLength(2)
      })
      it('uses the first caller TTL and retry policy for an in-flight group', async () => {
        mock.onGet('/policy').replyOnce(500).onGet('/policy').reply(200, 'ok')
        const client = new Client({}, instance)
        const requests = [client.request({ url: '/policy' }, 100, 1), client.request({ url: '/policy' }, 0, 0)]
        const responses = await settle(Promise.all(requests))
        expect(responses[0]).toBe(responses[1])
        expect(mock.history.get).toHaveLength(2)
        expect(await client.request({ url: '/policy' })).toBe(responses[0])
        await vi.advanceTimersByTimeAsync(101)
        await settle(client.request({ url: '/policy' }))
        expect(mock.history.get).toHaveLength(3)
      })
      it('shares and caches the original rejection until expiry', async () => {
        mock.onGet('/error').reply(404, 'missing')
        const client = new Client({}, instance)
        const results = await settle(Promise.allSettled([client.request({ url: '/error' }, 50), client.request({ url: '/error' }, 50)]))
        expect(results[0].status).toBe('rejected')
        expect(results[1]).toEqual(results[0])
        await expect(client.request({ url: '/error' }, 50)).rejects.toMatchObject({ response: { status: 404 } })
        expect(mock.history.get).toHaveLength(1)
        await vi.advanceTimersByTimeAsync(51)
        await expect(settle(client.request({ url: '/error' }, 50))).rejects.toMatchObject({ response: { status: 404 } })
        expect(mock.history.get).toHaveLength(2)
      })
      it('retries 4xx errors and preserves maxRetry and fixed negative delay semantics', async () => {
        mock.onGet('/retry').reply(400)
        const client = new Client({ maxRetry: 2 } as any, instance)
        await expect(settle(client.request({ url: '/retry' }, -1, 5, -20))).rejects.toMatchObject({ response: { status: 400 } })
        expect(mock.history.get).toHaveLength(3)
      })
      it('deep merges headers, returns a detached default config, and omits maxRetry', async () => {
        mock.onGet('/config').reply(config => [200, config.headers])
        const client = new Client({ headers: { 'X-One': '1', 'X-Two': '2' }, maxRetry: 1 } as any, instance)
        const defaults = client.getDefaultConfig()
        ;(defaults.headers as any)['X-One'] = 'changed'
        expect(client.getDefaultConfig()).not.toHaveProperty('maxRetry')
        expect((await settle(client.request({ url: '/config', headers: { 'X-Two': 'override' } }))).data).toMatchObject({ 'X-One': '1', 'X-Two': 'override' })
      })
      it('replaces defaults rather than merging, and resets an existing instance', () => {
        const client = new Client({ timeout: 20, headers: { 'X-Old': 'yes' } }, instance)
        const previous = client.instance
        expect(client.setDefaultConfig({ baseURL: '/new' })).toBe(true)
        expect(client.getDefaultConfig()).toEqual({ baseURL: '/new' })
        if (instance) expect(client.instance).not.toBe(previous)
        else expect(client.instance).toBeNull()
      })
      it('preserves cache reuse when resetting to the same configuration', async () => {
        mock.onGet('/cache').reply(200, 'ok')
        const client = new Client({}, instance)
        const first = await settle(client.request({ url: '/cache' }, 1000))
        client.setDefaultConfig({})
        expect(await client.request({ url: '/cache' }, 1000)).toBe(first)
        expect(mock.history.get).toHaveLength(1)
      })
      it('allows response interceptors to return application data', async () => {
        if (!instance) return
        const client = new Client({}, true)
        client.instance!.interceptors.response.use(response => response.data)
        mock.onGet('/data').reply(200, { ok: true })
        expect(await settle(client.request({ url: '/data' }))).toEqual({ ok: true })
      })
    })
  }
}

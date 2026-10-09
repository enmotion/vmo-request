import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../../index'

export function retrySuite(createInstance: boolean) {
  describe(`retry and concurrency (instance=${createInstance})`, () => {
    let mock: MockAdapter
    beforeEach(() => { vi.useFakeTimers(); mock = new MockAdapter(axios) })
    afterEach(() => { mock.restore(); vi.useRealTimers() })
    async function settle<T>(promise: Promise<T>): Promise<T> {
      const outcome = promise.then(value => ({ value }), error => ({ error }))
      await vi.runAllTimersAsync()
      const result = await outcome
      if ('error' in result) throw result.error
      return result.value
    }
    it('sends only one request for 500 concurrent callers', async () => {
      mock.onPost('/concurrent').reply(200, 'ok')
      const client = new VmoRequest({}, createInstance)
      const responses = await settle(Promise.all(Array.from({ length: 500 }, () => client.request({ method: 'post', url: '/concurrent' }))))
      expect(responses).toHaveLength(500)
      expect(responses.every(response => response === responses[0])).toBe(true)
      expect(mock.history.post).toHaveLength(1)
    })
    it('retries until the third attempt succeeds', async () => {
      mock.onPost('/retry').replyOnce(500).onPost('/retry').replyOnce(404).onPost('/retry').reply(200, 'success')
      const client = new VmoRequest({}, createInstance)
      expect((await settle(client.request({ url: '/retry', method: 'post' }, 0, 3))).data).toBe('success')
      expect(mock.history.post).toHaveLength(3)
    })
    it('shares a final rejection with every concurrent caller', async () => {
      mock.onGet('/failure').reply(500)
      const client = new VmoRequest({}, createInstance)
      const results = await settle(Promise.allSettled(Array.from({ length: 10 }, () => client.request({ url: '/failure' }, 0, 2))))
      expect(results.every(result => result.status === 'rejected')).toBe(true)
      expect(results.every(result => result.status === 'rejected' && result.reason === (results[0] as PromiseRejectedResult).reason)).toBe(true)
      expect(mock.history.get).toHaveLength(3)
    })
    it('caps retries at the default maxRetry of nine', async () => {
      mock.onGet('/limit').reply(500)
      const client = new VmoRequest({}, createInstance)
      await expect(settle(client.request({ url: '/limit' }, 0, 100))).rejects.toMatchObject({ response: { status: 500 } })
      expect(mock.history.get).toHaveLength(10)
    })
    it('uses the configured cap and waits between attempts', async () => {
      mock.onGet('/delay').reply(500)
      const client = new VmoRequest({ maxRetry: 2 }, createInstance)
      const outcome = client.request({ url: '/delay' }, 0, 100, 1000).catch(error => error)
      await vi.advanceTimersByTimeAsync(0)
      expect(mock.history.get).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(999)
      expect(mock.history.get).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(mock.history.get).toHaveLength(2)
      await vi.advanceTimersByTimeAsync(1000)
      expect(mock.history.get).toHaveLength(3)
      expect((await outcome).response.status).toBe(500)
      await vi.runAllTimersAsync()
    })
  })
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../index'

let mock: MockAdapter
beforeEach(() => { mock = new MockAdapter(axios) })
afterEach(() => mock.restore())
const flush = () => new Promise(resolve => setTimeout(resolve, 5))

describe('request reliability', () => {
  it('preserves defaults when deduplication is disabled', async () => {
    mock.onGet('/defaults').reply(config => [200, { baseURL: config.baseURL, header: config.headers?.['X-Test'] }])
    const client = new VmoRequest({ baseURL: 'https://example.test', headers: { 'X-Test': 'yes' } })
    const response = await client.request({ url: '/defaults' }, -1)
    expect(response.data).toEqual({ baseURL: 'https://example.test', header: 'yes' })
  })
  it('distinguishes URLSearchParams bodies', async () => {
    mock.onPost('/body').reply(config => [200, config.data])
    const client = new VmoRequest({})
    const a = await client.request({ url: '/body', method: 'post', data: new URLSearchParams({ a: '1' }) }, 1000)
    await flush()
    const b = await client.request({ url: '/body', method: 'post', data: new URLSearchParams({ a: '2' }) }, 1000)
    expect(a.data).toBe('a=1')
    expect(b.data).toBe('a=2')
    expect(mock.history.post).toHaveLength(2)
  })
  it('deduplicates equivalent plain object configurations regardless of key order', async () => {
    mock.onGet('/same').reply(200, 'ok')
    const client = new VmoRequest({})
    await Promise.all([
      client.request({ url: '/same', params: { a: 1, b: 2 } }),
      client.request({ params: { b: 2, a: 1 }, url: '/same' })
    ])
    expect(mock.history.get).toHaveLength(1)
  })
  it('preserves the published instance reset semantics', async () => {
    const client = new VmoRequest({}, true)
    const instance = client.instance!
    instance.interceptors.request.use(config => { config.headers.set('X-Test', 'old'); return config })
    client.setDefaultConfig({ baseURL: 'https://new.test' })
    mock.onGet('/instance').reply(config => [200, config.headers?.['X-Test'] ?? 'none'])
    expect(client.instance).not.toBe(instance)
    expect((await client.request({ url: '/instance' }, -1)).data).toBe('none')
  })
  it('expires the same request key', async () => {
    mock.onGet('/ttl').reply(200, 'ok')
    const client = new VmoRequest({})
    await client.request({ url: '/ttl' }, 10)
    await new Promise(resolve => setTimeout(resolve, 30))
    await client.request({ url: '/ttl' }, 10)
    expect(mock.history.get).toHaveLength(2)
  })
  it('does not retry cancellation', async () => {
    mock.onGet('/cancel').reply(() => { throw new axios.CanceledError('cancelled') })
    const client = new VmoRequest({})
    await expect(client.request({ url: '/cancel' }, -1, 3)).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect(mock.history.get).toHaveLength(1)
  })
})

// Fake time keeps timing assertions deterministic and covers cleanup without real delays.
describe('edge cases and cache isolation', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  async function settle<T>(promise: Promise<T>): Promise<T> {
    const result = promise.then(value => ({ value }), error => ({ error }))
    await vi.runAllTimersAsync()
    const outcome = await result
    if ('error' in outcome) throw outcome.error
    return outcome.value
  }
  const adapter = async (config: any) => ({ config, data: config.data, status: 200, statusText: 'OK', headers: {} })

  it('snapshots mutable form fields and handles uploaded files', async () => {
    const client = new VmoRequest({ adapter })
    const form = new FormData()
    form.append('field', 'first')
    form.append('file', new File(['content'], 'file.txt'))
    const first = await settle(client.request({ url: '/form', method: 'post', data: form }, 1000))
    expect(await client.request({ url: '/form', method: 'post', data: form }, 1000)).toBe(first)
    form.set('field', 'second')
    expect(await settle(client.request({ url: '/form', method: 'post', data: form }, 1000))).not.toBe(first)
  })
  it('distinguishes binary contents, including typed array offsets', async () => {
    const client = new VmoRequest({ adapter })
    for (const data of [new Uint8Array([1]).buffer, new Uint8Array([2]).buffer, new Uint8Array([0, 1, 0]).subarray(1, 2), new DataView(new Uint8Array([2]).buffer)]) {
      await settle(client.request({ url: '/bytes', method: 'post', data }, 1000))
    }
    expect(Object.keys((client as any)._queues)).toHaveLength(4)
  })
  it('handles date values, null prototypes and opaque configuration objects', async () => {
    class Metadata { constructor(public value: string) {} }
    const client = new VmoRequest({ adapter })
    for (const params of [null, { when: new Date('2024-01-01') }, { when: new Date(NaN) }, Object.assign(Object.create(null), { a: 1 }), new Metadata('one'), new Metadata('two')]) {
      await settle(client.request({ url: '/metadata', params }, 1000))
    }
    expect(Object.keys((client as any)._queues)).toHaveLength(6)
  })
  it('rejects circular Axios configuration and settles all waiting callers', async () => {
    const params: any = {}; params.self = params
    const client = new VmoRequest({})
    const responses = await settle(Promise.allSettled([client.request({ url: '/cycle', params }), client.request({ url: '/cycle', params })]))
    expect(responses.map(result => result.status)).toEqual(['rejected', 'rejected'])
    expect(Object.keys((client as any)._queues)).toHaveLength(0)
  })
  it('does not merge distinct adapters or cancellation signals', async () => {
    const firstAdapter = vi.fn(adapter)
    const secondAdapter = vi.fn(adapter)
    const client = new VmoRequest({})
    await settle(Promise.all([
      client.request({ url: '/identity', adapter: firstAdapter, signal: new AbortController().signal }),
      client.request({ url: '/identity', adapter: firstAdapter, signal: new AbortController().signal }),
      client.request({ url: '/identity', adapter: secondAdapter })
    ]))
    expect(firstAdapter).toHaveBeenCalledTimes(2)
    expect(secondAdapter).toHaveBeenCalledTimes(1)
  })
  it('includes externally modified instance defaults in the cache key', async () => {
    const client = new VmoRequest({}, true)
    mock.onGet('/headers').reply(config => [200, config.headers?.['X-Session']])
    client.instance!.defaults.headers.common['X-Session'] = 'first'
    expect((await settle(client.request({ url: '/headers' }, 1000))).data).toBe('first')
    client.instance!.defaults.headers.common['X-Session'] = 'second'
    expect((await settle(client.request({ url: '/headers' }, 1000))).data).toBe('second')
    expect(mock.history.get).toHaveLength(2)
  })
  it('cleans expired entries without deleting pending or fresh requests', async () => {
    const client = new VmoRequest({})
    mock.onGet('/expired').reply(200)
    mock.onGet('/fresh').reply(200)
    mock.onGet('/pending').reply(() => new Promise(resolve => setTimeout(() => resolve([200, 'done']), 2000)))
    await settle(client.request({ url: '/expired' }, 10))
    await settle(client.request({ url: '/fresh' }, 10000))
    const pending = client.request({ url: '/pending' })
    await vi.advanceTimersByTimeAsync(1001)
    expect((await client.request({ url: '/fresh' }, 10000)).status).toBe(200)
    expect(Object.keys((client as any)._queues)).toHaveLength(2)
    expect((await settle(pending)).data).toBe('done')
  })
  it('keeps old pending callers alive when defaults are reset', async () => {
    const client = new VmoRequest({ baseURL: '/old' }, true)
    mock.onGet('/reset').reply(config => new Promise(resolve => setTimeout(() => resolve([200, config.baseURL]), 20)))
    const first = client.request({ url: '/reset' }, 1000)
    const waiter = client.request({ url: '/reset' }, 1000)
    client.setDefaultConfig({ baseURL: '/new' })
    const second = client.request({ url: '/reset' }, 1000)
    const result = await settle(Promise.all([first, waiter, second]))
    expect(result.map(response => response.data)).toEqual(['/old', '/old', '/new'])
    expect(result[0]).toBe(result[1])
  })
  it('does not poison the cache after cancellation', async () => {
    mock.onGet('/cancel-cache').replyOnce(() => { throw new axios.CanceledError() }).onGet('/cancel-cache').reply(200, 'ok')
    const client = new VmoRequest({})
    await expect(settle(client.request({ url: '/cancel-cache' }, 10000, 2))).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect((await settle(client.request({ url: '/cancel-cache' }, 10000))).data).toBe('ok')
    expect(mock.history.get).toHaveLength(2)
  })
  it('stops retrying when an adapter aborts its signal with a non-cancellation error', async () => {
    const controller = new AbortController()
    mock.onGet('/abort').reply(500)
    const client = new VmoRequest({}, true)
    client.instance!.interceptors.response.use(undefined, () => { controller.abort(); throw new Error('adapter failed') })
    await expect(settle(client.request({ url: '/abort', signal: controller.signal }, -1, 3))).rejects.toThrow('adapter failed')
    expect(mock.history.get).toHaveLength(1)
  })
  it('bounds infinite retry requests and normalizes non-finite counts and delay', async () => {
    mock.onGet('/numbers').reply(500)
    const client = new VmoRequest({ maxRetry: 2 })
    await expect(settle(client.request({ url: '/numbers' }, -1, Infinity, NaN))).rejects.toMatchObject({ response: { status: 500 } })
    expect(mock.history.get).toHaveLength(3)
    mock.resetHistory()
    await expect(settle(client.request({ url: '/numbers' }, -1, NaN))).rejects.toMatchObject({ response: { status: 500 } })
    expect(mock.history.get).toHaveLength(1)
  })
})

describe('already cancelled requests', () => {
  it('rejects an aborted signal even if a successful cache entry exists', async () => {
    mock.onGet('/pre-abort').reply(200, 'ok')
    const client = new VmoRequest({})
    const controller = new AbortController()
    await client.request({ url: '/pre-abort', signal: controller.signal }, 1000)
    await flush()
    controller.abort()
    await expect(client.request({ url: '/pre-abort', signal: controller.signal }, 1000)).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect(mock.history.get).toHaveLength(1)
  })
  it('supports the legacy CancelToken and checks default cancellation configuration', async () => {
    mock.onGet('/token').reply(200, 'ok')
    const token = axios.CancelToken.source()
    const client = new VmoRequest({ cancelToken: token.token })
    await client.request({ url: '/token' }, 1000)
    await flush()
    token.cancel('stop')
    await expect(client.request({ url: '/token' }, 1000)).rejects.toMatchObject({ message: 'stop', code: 'ERR_CANCELED' })
    expect(mock.history.get).toHaveLength(1)
  })
})

describe('runtime compatibility', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('works in runtimes without FormData or URLSearchParams globals', async () => {
    vi.stubGlobal('FormData', undefined)
    vi.stubGlobal('URLSearchParams', undefined)
    mock.onGet('/older-runtime').reply(200, 'ok')
    const client = new VmoRequest({})
    expect((await client.request({ url: '/older-runtime' })).data).toBe('ok')
    await flush()
  })
  it('snapshots AxiosHeaders values when a headers object is reused', async () => {
    const headers = new axios.AxiosHeaders({ 'X-Session': 'first' })
    mock.onGet('/axios-headers').reply(config => [200, config.headers?.['X-Session']])
    const client = new VmoRequest({})
    expect((await client.request({ url: '/axios-headers', headers }, 1000)).data).toBe('first')
    await flush()
    headers.set('X-Session', 'second')
    expect((await client.request({ url: '/axios-headers', headers }, 1000)).data).toBe('second')
    await flush()
    expect(mock.history.get).toHaveLength(2)
  })
})

describe('configuration update failures', () => {
  it('leaves the working instance and defaults intact if a reset fails', () => {
    const client = new VmoRequest({ baseURL: '/working' }, true)
    const instance = client.instance
    expect(() => client.setDefaultConfig(1 as any)).toThrow('setDefaultConfig with wrong params')
    expect(client.instance).toBe(instance)
    expect(client.getDefaultConfig()).toEqual({ baseURL: '/working' })
  })
})

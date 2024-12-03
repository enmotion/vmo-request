import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../index'

let mock: MockAdapter
let vmoRequest: VmoRequest

beforeAll(() => {
  mock = new MockAdapter(axios)
  console.log(mock.history.post.length, 'length')
  vmoRequest = new VmoRequest({ baseURL: 'https://api.example.com' })
})

afterAll(() => {
  mock.restore()
})

describe('VmoRequest Initialization', () => {
  it('should initialize with default config', () => {
    expect(vmoRequest.getDefaultConfig()).toEqual({ baseURL: 'https://api.example.com' })
  })

  it('should update default config', () => {
    vmoRequest.setDefaultConfig({ baseURL: 'https://api2.example.com', timeout: 5000 })
    expect(vmoRequest.getDefaultConfig()).toEqual({ baseURL: 'https://api2.example.com', timeout: 5000 })
  })
})

describe('VmoRequest Cache', () => {
  it('should return cached response if cache exists and not expired', async () => {
    mock.onGet('/test').reply(200, 'test data')
    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    expect(response1.data).toEqual('test data')
    expect(response1).toEqual(response2)
    expect(mock.history.get.length).toBe(1)
  })

  it('should make new request if cache expired', async () => {
    mock.onGet('/test').reply(200, { data: 'test data' })
    mock.onGet('/test2').reply(200, { data: 'test data 2' })

    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const response2 = await vmoRequest.request({ method: 'get', url: '/test2' }, 500)

    expect(mock.history.get.length).toBe(2)
    expect(response1).not.toEqual(response2)
  })
})

describe('VmoRequest Concurrency', () => {
  it('should reuse pending promise for concurrent requests', async () => {
    mock.onPost('/test').reply(200, { data: 'test data' })
    const queries: any[] = []
    for (let k = 0; k < 10; k++) {
      queries.push(vmoRequest.request({ method: 'post', url: '/test' }, 10000))
    }
    const [
      response1,
      response2,
      response3,
      response4,
      response5,
      response6,
      response7,
      response8,
      response9,
      response10
    ] = await Promise.all(queries)

    expect([response1, response2, response3, response4, response5]).toEqual([
      response6,
      response7,
      response8,
      response9,
      response10
    ])
    expect(mock.history.post.length).toBe(1)
  })
})
describe('VmoRequest Concurrency not reuse', () => {
  it('should not reuse pending promise for concurrent requests', async () => {
    mock.onPost('/test2').reply(200, { data: 'test data' })
    const queries: any[] = []
    for (let k = 0; k < 10; k++) {
      queries.push(vmoRequest.request({ method: 'post', url: '/test2' }))
    }
    const [
      response1,
      response2,
      response3,
      response4,
      response5,
      response6,
      response7,
      response8,
      response9,
      response10
    ] = await Promise.all(queries)

    expect([response1, response2, response3, response4, response5]).toEqual([
      response6,
      response7,
      response8,
      response9,
      response10
    ])
    expect(mock.history.post.length).toBe(11)
  })
})

describe('VmoRequest', () => {
  it('should handle API error and return rejected promise', async () => {
    // 创建一个模拟的 Axios 实例
    const mockAxios = vi.spyOn(axios, 'request')
    // 模拟返回错误
    const errorResponse = {
      status: 500,
      data: { message: 'Internal Server Error' }
    }
    mockAxios.mockRejectedValue(errorResponse)
    // 创建 VmoRequest 实例
    const vmoRequest = new VmoRequest({ baseURL: 'https://api.example.com' })
    // 调用 request 方法并期望返回错误
    const result = vmoRequest.request(
      {
        url: '/failing-endpoint',
        method: 'get'
      },
      10000
    ) // 设置缓存时间为 10 秒
    await expect(result).rejects.toEqual(errorResponse)
    // 清理模拟
    mockAxios.mockRestore()
  })

  it('should cache the error response and return it for subsequent requests', async () => {
    // 创建一个模拟的 Axios 实例
    const mockAxios = vi.spyOn(axios, 'request')

    // 模拟返回错误
    const errorResponse = {
      status: 500,
      data: { message: 'Internal Server Error' }
    }
    mockAxios.mockRejectedValue(errorResponse)

    // 创建 VmoRequest 实例
    const vmoRequest = new VmoRequest({ baseURL: 'https://api.example.com' })

    // 第一次调用 request 方法并期望返回错误
    const firstRequest = vmoRequest.request(
      {
        url: '/failing-endpoint',
        method: 'get'
      },
      10000
    ) // 设置缓存时间为 10 秒

    await expect(firstRequest).rejects.toEqual(errorResponse)

    // 第二次调用 request 方法，期望返回缓存的错误
    const secondRequest = vmoRequest.request(
      {
        url: '/failing-endpoint',
        method: 'get'
      },
      10000
    )

    await expect(secondRequest).rejects.toEqual(errorResponse)

    // 确保 axios.request 只被调用了一次（第一次请求时）
    expect(mockAxios).toHaveBeenCalledTimes(1)

    // 清理模拟
    mockAxios.mockRestore()
  })
})

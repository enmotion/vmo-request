import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../index'

let mock: MockAdapter
let vmoRequest: VmoRequest

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
beforeEach(() => {
  mock = new MockAdapter(axios)
  vmoRequest = new VmoRequest({ baseURL: 'https://api.example.com' }, true)
  vmoRequest.instance.interceptors.response.use(res => {
    // console.log('send:', res.data)
    return res
  })
})

afterAll(() => {
  mock.restore()
})

describe('VmoRequest Initialization', () => {
  it('should initialize with default config', () => {
    expect(vmoRequest.instance).not.toBeNull()
    expect(vmoRequest.getDefaultConfig()).toEqual({ baseURL: 'https://api.example.com' })
  })

  it('should update default config', () => {
    vmoRequest.setDefaultConfig({ baseURL: 'https://api2.example.com', timeout: 5000 })
    expect(vmoRequest.instance).not.toBeNull()
    expect(vmoRequest.getDefaultConfig()).toEqual({ baseURL: 'https://api2.example.com', timeout: 5000 })
  })
})

describe('VmoRequest Cache', () => {
  it('should return cached response if cache exists and not expired', async () => {
    expect(vmoRequest.instance).not.toBeNull()
    mock.onGet('/test').reply(200, 'test data')
    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    // console.log(response1, response2, 'aaaaaa')
    expect(response1.data).toEqual('test data')
    expect(response1).toEqual(response2)
    expect(mock.history.get.length).toBe(1)
  })

  it('should make new request if cache expired', async () => {
    mock.onGet('/test').reply(200, { data: 'test data' })
    mock.onGet('/test').reply(200, { data: 'test data' })

    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    await sleep(1000)
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    expect(vmoRequest.instance).not.toBeNull()
    expect(mock.history.get.length).toBe(2)
    expect(response1).toEqual(response2)
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
    expect(vmoRequest.instance).not.toBeNull()
    expect([response1, response2, response3, response4, response5]).toEqual([
      response6,
      response7,
      response8,
      response9,
      response10
    ])
    expect(mock.history.post.length).toBe(1)
  })
  it('should reuse pending promise for concurrent requests with cache', async () => {
    mock.onPost('/test').reply(200, { data: 'test data' })
    const request1 = await vmoRequest.request({ method: 'post', url: '/test' }, 10000)
    await sleep(2000)
    const request2 = await vmoRequest.request({ method: 'post', url: '/test' }, 10000)
    expect(vmoRequest.instance).not.toBeNull()
    expect(mock.history.post.length).toBe(1)
    expect(request1).equals(request2)
  })
})

describe('VmoRequest', () => {
  it('should handle API error and return rejected promise', async () => {
    // 创建一个模拟的 Axios 实例
    mock.onPost('/error').reply(500, { message: 'somthing wrong' })
    expect(vmoRequest.instance).not.toBeNull()
    try {
      const result = await vmoRequest.request(
        {
          url: '/error',
          method: 'post'
        },
        10000
      ) // 设置缓存时间为 10 秒
    } catch (err) {
      expect(err.response.data).toEqual({ message: 'somthing wrong' })
    }
    // await expect(result).rejects.toEqual({ message: 'somthing wrong' })
  })

  it('should cache the error response and return it for subsequent requests', async () => {
    mock.onPost('/error').reply(500, { message: 'somthing wrong' })
    expect(vmoRequest.instance).not.toBeNull()
    try {
      await vmoRequest.request(
        {
          url: '/error',
          method: 'post'
        },
        10000
      ) // 设置缓存时间为 10 秒
    } catch (err) {
      expect(err.response.data).toEqual({ message: 'somthing wrong' })
    }
    try {
      sleep(2000)
      await vmoRequest.request(
        {
          url: '/error',
          method: 'post'
        },
        10000
      ) // 设置缓存时间为 10 秒
    } catch (err) {
      expect(err.response.data).toEqual({ message: 'somthing wrong' })
      expect(mock.history.post.length).toBe(1)
    }
  })
})

describe('VmoRequest Concurrency reuse reject cache', () => {
  it('should reuse rejected promise for concurrent requests2', async () => {
    mock.onGet('/error').reply(500, {
      error: 'Internal Server Error'
    })
    let error1
    let error2

    try {
      // 第一次请求，1秒后发出
      await sleep(0)
      await vmoRequest.request(
        {
          url: '/error',
          method: 'get'
        },
        10000
      )
    } catch (error) {
      error1 = error
    }

    try {
      // 第二次请求，10秒后发出
      await sleep(1000)
      await await vmoRequest.request(
        {
          url: '/error',
          method: 'get'
        },
        10000
      )
    } catch (error) {
      error2 = error
    }
    expect(vmoRequest.instance).not.toBeNull()
    // 比较两次请求的错误结果
    expect(error1).toEqual(error2)
  })
})
describe('VmoRequest Concurrency reuse reject cache', () => {
  it('should reuse rejected promise for concurrent requests2', async () => {
    mock.onGet('/error').reply(500, {
      error: 'Internal Server Error'
    })
    let error1
    let error2

    try {
      await vmoRequest.request(
        {
          url: '/error',
          method: 'get'
        },
        0
      )
    } catch (error) {
      error1 = error
    }

    try {
      await await vmoRequest.request(
        {
          url: '/error',
          method: 'get'
        },
        0
      )
    } catch (error) {
      error2 = error
    }
    expect(vmoRequest.instance).not.toBeNull()
    // 比较两次请求的错误结果
    expect(error1).toEqual(error2)
  })
})

describe('VmoRequest no cache and union', () => {
  it('should don`t activated any union', async () => {
    mock.onGet('/test').reply(200, 'test data')
    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, -1)
    const response3 = await vmoRequest.request({ method: 'get', url: '/test' }, -1)
    const response4 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    const response5 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    const response6 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    const response7 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    const response8 = await vmoRequest.request({ method: 'get', url: '/test' }, -1)
    const response9 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    const response0 = await vmoRequest.request({ method: 'get', url: '/test' }, 100)
    expect(vmoRequest.instance).not.toBeNull()
    expect(response1.data).toEqual('test data')
    expect(response1).toEqual(response2)
    expect(mock.history.get.length).toBe(4)
  })
})

describe('VmoRequest throw error', () => {
  it('should throw error setDefaultConfig with wrong params', async () => {
    expect(() => vmoRequest.setDefaultConfig(1)).toThrow(TypeError)
    expect(() => vmoRequest.setDefaultConfig(1)).toThrow('setDefaultConfig with wrong params')
  })
  it('should throw error new VmoRequest with wrong params', async () => {
    expect(() => new VmoRequest(1, true)).toThrow(TypeError)
    expect(() => new VmoRequest(1, true)).toThrow('new VmoRequest: with wrong params')
  })
  // it('should throw error new VmoRequest with wrong params', async () => {
  //   expect(async () => await vmoRequest.request(1, 'a', 'a')).toThrow(TypeError)
  //   expect(async () => await vmoRequest.request(1, 'a', 'a')).toThrow('VmoRequest: request with wrong params')
  // })
})

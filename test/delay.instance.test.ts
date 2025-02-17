import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../index'

let mock: MockAdapter
let vmoRequest: VmoRequest

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

describe('VmoRequest Concurrency not reuse', () => {
  it('should not reuse pending promise for concurrent requests', async () => {
    expect(vmoRequest.instance).not.toBeNull()
    mock.onPost('/test2').reply(200, { data: 'test data' })
    const queries: any[] = []
    for (let k = 0; k < 500; k++) {
      queries.push(vmoRequest.request({ method: 'post', url: '/test2' }))
    }
    const [response1, response2] = await Promise.all(queries)
    // console.log(queries.length)
    expect(response1).toEqual(response2)
    expect(mock.history.post.length).toBe(1)
  })
  it('should retry untill success', async () => {
    expect(vmoRequest.instance).not.toBeNull()
    // 模拟接口返回的数据
    const responses = [
      { status: 303, data: { message: 'Partial Success' } },
      { status: 500, data: { message: 'Internal Server Error' } },
      { status: 404, data: { message: 'Not Found' } },
      { status: 200, data: { message: 'Success' } }
    ]
    mock.onPost('/test2').reply(() => {
      // 随机选择一个响应
      const randomResponse = responses[mock.history.post.length]
      // 返回随机响应
      return [randomResponse.status, randomResponse.data]
    })
    try {
      const res = await vmoRequest.request({ method: 'post', url: '/test2' }, 0, 30)
      // console.log(res, mock.history.post.length)
      expect(mock.history.post.length).toBe(3)
      expect(res.data).toEqual({ message: 'Success' })
    } catch {
      expect(mock.history.post.length).toBe(31)
    }
  })
  it('should retry but limit by maxRetry', async () => {
    expect(vmoRequest.instance).not.toBeNull()
    // 模拟接口返回的数据
    const responses = [
      { status: 303, data: { message: 'Partial Success' } },
      { status: 500, data: { message: 'Internal Server Error' } },
      { status: 404, data: { message: 'Not Found' } },
      { status: 333, data: { message: 'Success' } }
    ]
    mock.onPost('/test2').reply(() => {
      // 随机选择一个响应
      const randomResponse = responses[mock.history.post.length]
      // 返回随机响应
      return [randomResponse.status, randomResponse.data]
    })
    try {
      const res = await vmoRequest.request({ method: 'post', url: '/test2' }, 0, 30)
      // console.log(res, mock.history.post.length)
      expect(mock.history.post.length).toBe(3)
      expect(res.data).toEqual({ message: 'Success' })
    } catch {
      expect(mock.history.post.length).toBe(10)
    }
  })
  it('should retry limit by maxRetry', async () => {
    expect(vmoRequest.instance).not.toBeNull()
    // 模拟接口返回的数据
    const responses = [
      { status: 303, data: { message: 'Partial Success' } },
      { status: 500, data: { message: 'Internal Server Error' } },
      { status: 404, data: { message: 'Not Found' } },
      { status: 333, data: { message: 'Success' } }
    ]
    mock.onPost('/test2').reply(() => {
      // 随机选择一个响应
      const randomResponse = responses[mock.history.post.length]
      // 返回随机响应
      return [randomResponse.status, randomResponse.data]
    })
    try {
      const res = await vmoRequest.request({ method: 'post', url: '/test2' }, 0, 1000,100)
      // console.log(res, mock.history.post.length)
      expect(mock.history.post.length).toBe(3)
      expect(res.data).toEqual({ message: 'Success' })
    } catch {
      expect(mock.history.post.length).toBe(10)
    }
  },20000)
  it('should retry limit by reset maxRetry', async () => {
    const vmoRequest2 = new VmoRequest({ baseURL: 'https://api.example.com', maxRetry: 9 }, true)
    expect(vmoRequest2.instance).not.toBeNull()
    // 模拟接口返回的数据
    const responses = [
      { status: 303, data: { message: 'Partial Success' } },
      { status: 500, data: { message: 'Internal Server Error' } },
      { status: 404, data: { message: 'Not Found' } },
      { status: 333, data: { message: 'Success' } }
    ]
    mock.onPost('/test2').reply(() => {
      // 随机选择一个响应
      const randomResponse = responses[mock.history.post.length]
      // 返回随机响应
      return [randomResponse.status, randomResponse.data]
    })
    try {
      const res = await vmoRequest2.request({ method: 'post', url: '/test2' }, 0, 1000,1000)
      console.log(res, mock.history.post.length)
      expect(mock.history.post.length).toBe(3)
      expect(res.data).toEqual({ message: 'Success' })
    } catch {
      console.log(mock.history.post.length)
      expect(mock.history.post.length).toBe(10)
    }
  },20000)
})

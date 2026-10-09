import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
  vmoRequest = new VmoRequest({ baseURL: 'https://api.example.com' })
})

afterEach(() => {
  mock.restore()
})

describe('VmoRequest Initialization', () => {
  it('should initialize with default config', () => {
    expect(vmoRequest.instance).toEqual(null)
    expect(vmoRequest.getDefaultConfig()).toEqual({ baseURL: 'https://api.example.com' })
  })

  it('should update default config', () => {
    vmoRequest.setDefaultConfig({ baseURL: 'https://api2.example.com', timeout: 5000 })
    expect(vmoRequest.instance).toEqual(null)
    expect(vmoRequest.getDefaultConfig()).toEqual({ baseURL: 'https://api2.example.com', timeout: 5000 })
  })
})

describe('VmoRequest Cache', () => {
  it('should return cached response if cache exists and not expired', async () => {
    mock.onGet('/test').reply(200, 'test data')
    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, 10000)
    expect(vmoRequest.instance).toEqual(null)
    expect(response1.data).toEqual('test data')
    expect(response1).toEqual(response2)
    expect(mock.history.get.length).toBe(1)
  })

  it('should make new request if cache expired', async () => {
    mock.onGet('/test').reply(200, { data: 'test data' })


    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, 50)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, 50)
    expect(vmoRequest.instance).toEqual(null)
    expect(mock.history.get.length).toBe(2)
    expect(response1.data).toEqual(response2.data)
  })
})

describe('VmoRequest no cache and union', () => {
  it('should don`t activated any union', async () => {
    mock.onGet('/test').reply(200, 'test data')
    const response1 = await vmoRequest.request({ method: 'get', url: '/test' }, -1)
    const response2 = await vmoRequest.request({ method: 'get', url: '/test' }, -1)
    expect(vmoRequest.instance).toEqual(null)
    expect(response1.data).toEqual('test data')
    expect(response1).toEqual(response2)
    expect(mock.history.get.length).toBe(2)
  })
})

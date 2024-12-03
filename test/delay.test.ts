import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest } from '../index'

let mock: MockAdapter
let vmoRequest: VmoRequest

beforeAll(() => {
    mock = new MockAdapter(axios)
    vmoRequest = new VmoRequest({ baseURL: 'https://api.example.com' })
  })
  
  afterAll(() => {
    mock.restore()
  })

describe('VmoRequest Concurrency not reuse', () => {
    it('should not reuse pending promise for concurrent requests', async () => {
      mock.onPost('/test2').reply(200, { data: 'test data' })
      const queries: any[] = []
      for (let k = 0; k < 2; k++) {
        queries.push(vmoRequest.request({ method: 'post', url: '/test2' }))
      }
      const [
        response1,
        response2,
      ] = await Promise.all(queries)
  
      expect(response1).toEqual(response2)
      expect(mock.history.post.length).toBe(1)
    })
  })
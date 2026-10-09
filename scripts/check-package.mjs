import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { VmoRequest as ESMRequest } from '../dist/vmo-request.js'

const require = createRequire(import.meta.url)
const { VmoRequest: CJSRequest } = require('../dist/vmo-request.umd.cjs')

for (const [name, Client, transport, Adapter] of [
  ['ESM', ESMRequest, axios, MockAdapter],
  ['CJS', CJSRequest, require('axios'), require('axios-mock-adapter')]
]) {
  const mock = new Adapter(transport)
  try {
    mock.onGet('/test').reply(config => [200, config.headers['X-Test']])
    const client = new Client({ headers: { 'X-Test': name } })
    const responses = await Promise.all([client.request({ url: '/test' }, 100), client.request({ url: '/test' }, 100)])
    assert.equal(responses[0].data, name)
    assert.equal(responses[0], responses[1])
    assert.equal(mock.history.get.length, 1)
    assert.equal((await client.request({ url: '/test' }, -1)).data, name)
    assert.equal(mock.history.get.length, 2)
    console.log(`${name} package smoke test passed`)
  } finally {
    mock.restore()
  }
}

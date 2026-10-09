# Getting started

VmoRequest adds concurrent request deduplication, response caching, and retries to Axios. It is independent of UI frameworks such as React and Vue, and works in browsers and Node.js.

## Installation

```sh
npm install vmo-request axios ramda md5
```

Axios, Ramda, and MD5 are runtime peer dependencies. VitePress is only a documentation development dependency.

## Create a request entry point

Use the **named export**, not a default import.

```ts
import { VmoRequest } from 'vmo-request'

const api = new VmoRequest({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { Accept: 'application/json' }
})

const response = await api.request({ url: '/users', method: 'get' })
console.log(response.data)
```

By default, the result is an Axios response. Response interceptors can change its shape, so the public return type remains `Promise<any>`.

## One method, four arguments

```ts
await api.request(
  { url: '/users', method: 'get' },
  2000, // Cache the result for 2 seconds
  2,    // Up to 2 retries: at most 3 attempts including the first
  300   // Wait 300 milliseconds between attempts
)
```

| Argument | Default | Meaning |
| --- | --- | --- |
| `config` | Required | Axios configuration, deeply merged with defaults |
| `expiredTime` | `0` | Negative: independent calls; zero: deduplication only; positive: result TTL |
| `retry` | `0` | Retry count, bounded by `maxRetry` |
| `retryDelay` | `0` | Fixed retry delay in milliseconds |

## Share one client

```ts
// api.ts
export const api = new VmoRequest({ baseURL: '/api' })

// Different callers use the same entry point
const [first, second] = await Promise.all([
  api.request({ url: '/users' }, 2000),
  api.request({ url: '/users' }, 2000)
])

console.log(first === second) // true
```

Each VmoRequest instance owns its cache and waiting queue. Separate instances do not deduplicate each other's calls.

Continue with [caching and deduplication](./caching) or the [API reference](/en/api/).

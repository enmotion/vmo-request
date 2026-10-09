# Examples

These examples use a shared client. Adapt endpoint URLs, authentication, and error formats to your backend.

## Shared list queries

```ts
import { VmoRequest } from 'vmo-request'

const api = new VmoRequest({ baseURL: '/api', timeout: 5000 })
const getUsers = () => api.request({ url: '/users' }, 2000, 1, 300)

const [sidebar, page] = await Promise.all([getUsers(), getUsers()])
console.log(sidebar.data, page.data)
```

Calls deduplicate only when their configuration matches and they use the same client. A failed result can also be cached during this two-second period.

## Execute every submission independently

```ts
const result = await api.request({
  url: '/orders',
  method: 'post',
  data: { productId: 'p-001', quantity: 1 }
}, -1, 0)
```

A negative cache lifetime disables deduplication; zero retries avoids repeating the request automatically. Server-side idempotency is still the application's responsibility.

## Include identity explicitly

```ts
async function getProfile(token: string) {
  return api.request({
    url: '/profile',
    headers: { Authorization: `Bearer ${token}` }
  }, 1000)
}
```

Headers participate in the cache key, so different tokens do not share the same cached result. For server-side rendering, create a separate client per incoming user request to avoid sharing caches across users.

## Upload a form

```ts
const data = new FormData()
data.append('title', 'report')
data.append('file', file) // file comes from an upload control

await api.request({ url: '/files', method: 'post', data }, -1)
```

Usually, Axios and the runtime handle the multipart boundary without a manually specified header.

## Organize endpoint definitions

```ts
import type { RequestProps } from 'vmo-request'

const users: RequestProps<{ auth: boolean }> = {
  key: 'users',
  axiosConfig: { url: '/users', method: 'get' },
  middlConfig: { auth: true },
  expiredTime: 2000,
  retry: 1
}

await api.request(users.axiosConfig, users.expiredTime, users.retry)
```

The application interprets `middlConfig`; the library does not execute it automatically. See [retries and cancellation](./retries) for complete cancellation examples.

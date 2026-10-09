# Retries & cancellation

## Configure retries and delays

```ts
const api = new VmoRequest({ baseURL: '/api', maxRetry: 3 })

await api.request({ url: '/users' }, 0, 2, 500)
// After the initial failure, retry at most twice with a 500 ms delay
```

The default `retry = 0` disables retries. The default `maxRetry = 9` caps the requested count. For non-negative integer values, total attempts are at most `1 + Math.min(retry, maxRetry)`.

`retryDelay` is a fixed delay, not exponential backoff. Negative values use their absolute value. The current implementation bounds invalid counts and non-finite delays; see [upgrade compatibility](./upgrade).

## Which failures are retried

For compatibility, ordinary failures still follow the configured retry policy, including 4xx, 5xx, and network errors. POST is not automatically excluded, and `Retry-After` is not automatically interpreted.

Cancelled requests are not retried. A deduplicated group shares one execution process and its final success or failure.

::: warning Repeated writes
A server may complete a write before the client receives its response. Retrying can repeat that write. Use server-side idempotency keys for operations such as payments, or leave `retry = 0`.
:::

## Use AbortController

```ts
const controller = new AbortController()
const pending = api.request({
  url: '/users',
  signal: controller.signal
}, 0, 2, 300)

controller.abort()

try {
  await pending
} catch (error) {
  if (axios.isCancel(error)) {
    console.log('Request cancelled')
  } else {
    throw error
  }
}
```

This example requires `import axios from 'axios'`. Different signals are not accidentally deduplicated just because the rest of their configuration matches. Calls using the same signal share its cancellation behavior.

An aborted signal cannot hit a successful cache entry. Cancellation during a retry delay may only settle after that delay ends; cancelled requests are not retried further.

## Legacy CancelToken support

```ts
const source = axios.CancelToken.source()
const pending = api.request({ url: '/users', cancelToken: source.token })
source.cancel('Page left')
await pending.catch(error => {
  if (!axios.isCancel(error)) throw error
})
```

CancelToken remains available for existing projects. Prefer AbortController for new code.

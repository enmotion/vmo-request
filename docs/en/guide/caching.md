# Caching & deduplication

`expiredTime` controls deduplication and result caching. It is not an Axios network timeout; use `config.timeout` for that.

## Three modes

| `expiredTime` | Matching pending requests | Completed results |
| --- | --- | --- |
| `< 0`, such as `-1` | Sent independently | Not cached |
| `0` (default) | Deduplicated; result shared | Removed after the distribution window |
| `> 0`, such as `2000` | Deduplicated; result shared | Cached until the TTL expires |

```ts
await api.request({ url: '/users' }, -1)   // Independent execution
await api.request({ url: '/users' })       // Deduplication only
await api.request({ url: '/users' }, 2000) // Deduplication and caching
```

## How requests match

A cache key is generated from the merged Axios configuration. Instance mode also accounts for `instance.defaults`. Differences in URLs, methods, parameters, bodies, or headers affect matching.

The current implementation snapshots plain objects, URLSearchParams, text fields in FormData, binary data, and AxiosHeaders. Functions, cancellation controllers, uploaded files, and arbitrary custom objects are conservatively distinguished by identity.

Plain object property order does not affect keys. Different uploaded file objects may not deduplicate even when their contents match. Internal custom object state and external state captured by interceptors cannot be fully inferred; use independent requests or express the changing state in configuration.

## The first call chooses the policy

A request group uses its first caller's TTL, retry count, and delay. Later callers do not replace that policy.

```ts
const first = api.request({ url: '/users' }, 2000, 2, 300)
const second = api.request({ url: '/users' }, 0, 0)
await Promise.all([first, second])
// Both calls use the first caller's policy
```

## Successful and failed results can be cached

A positive TTL also caches ordinary errors. After a 500 response fails, later calls within the TTL receive the same rejection rather than immediately contacting the server. Cancellation errors are not retained as ordinary cached failures.

Results share their original object references. Mutating `response.data` can affect other callers. Make your own copy when independent data is needed.

## TTL and result distribution

To preserve existing behavior, waiting callers receive results in the next timer task after the initiating caller returns. The TTL starts at distribution time. With a TTL of zero, calls inside the same distribution window may still share a result.

Every cache hit checks expiry. Expired entries are periodically cleaned up by subsequent calls with deduplication enabled. There is no idle cleanup, capacity limit, or public cache-clearing method.

::: warning Write operations
POST and other methods also participate in deduplication. Use `expiredTime = -1` when every submission must execute independently. Client-side deduplication is not a substitute for server-side idempotency.
:::

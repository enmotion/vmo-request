# API reference

```ts
import { VmoRequest } from 'vmo-request'
import type { RequestProps } from 'vmo-request'
```

## Constructor

```ts
new VmoRequest(
  config: Partial<AxiosRequestConfig & { maxRetry: number }>,
  createInstance: boolean = false
)
```

| Argument | Description |
| --- | --- |
| `config` | Default Axios configuration; optional `maxRetry`, defaulting to 9 |
| `createInstance` | Create an independent Axios instance; defaults to `false` |

Instance creation failures throw `TypeError('new VmoRequest: with wrong params')`.

## request

```ts
request(
  config: Partial<AxiosRequestConfig>,
  expiredTime: number = 0,
  retry: number = 0,
  retryDelay: number = 0
): Promise<any>
```

| Argument | Description |
| --- | --- |
| `config` | Request configuration, deeply merged with wrapper defaults |
| `expiredTime` | Milliseconds; negative: independent requests; zero: deduplication only; positive: deduplication and caching |
| `retry` | Retry count, bounded by `maxRetry` in defaults |
| `retryDelay` | Fixed retry delay in milliseconds; negative values use their absolute value |

Resolves to an Axios response by default. Response interceptors can return application data. Rejects with the original error; handle failures using `try/catch` or `.catch()`.

## instance

```ts
get instance(): AxiosInstance | null
```

Returns an Axios instance only when `createInstance = true`; otherwise `null`. Use it to register interceptors or modify Axios defaults.

## getDefaultConfig

```ts
getDefaultConfig(): Partial<AxiosRequestConfig>
```

Returns a deep copy of wrapper defaults without `maxRetry`. It does not directly return the current instance's `defaults`.

## setDefaultConfig

```ts
setDefaultConfig(
  config: Partial<AxiosRequestConfig & { maxRetry: number }>
): boolean
```

Returns `true` on success. Replaces the entire configuration; an existing Axios instance is recreated and its interceptors are reset. Throws `TypeError('setDefaultConfig with wrong params')` on failure. The current fix preserves the original configuration if an update fails.

## RequestProps

```ts
type RequestProps<M> = {
  name?: string
  key: string
  axiosConfig: Partial<AxiosRequestConfig>
  middlConfig?: M
  expiredTime?: number
  retry?: number
}
```

This type helps organize an application's own endpoint definitions. `request()` accepts Axios configuration, not a RequestProps object.

`middlConfig` retains its existing spelling and is a data field. The library does not currently expose middleware registration or a `next()` execution interface, and does not execute this field automatically.

## Interfaces not provided

There is no `clearCache()`, middleware registration, cache subscription, public request state, or exponential backoff configuration. Internal implementation state is not a stable public API.

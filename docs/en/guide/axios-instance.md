# Axios instances & configuration

## Choose instance mode

```ts
const shared = new VmoRequest({ baseURL: '/api' })
console.log(shared.instance) // null

const api = new VmoRequest({ baseURL: '/api' }, true)
console.log(api.instance) // An Axios instance
```

Default mode sends requests through global Axios. Instance mode creates a separate Axios instance, useful when an application needs isolated interceptors.

## Register interceptors

```ts
api.instance!.interceptors.request.use(config => {
  config.headers.set('X-Client', 'web')
  return config
})

api.instance!.interceptors.response.use(response => response.data)

const users = await api.request({ url: '/users' })
// users is application data, not the full AxiosResponse
```

Cache keys are generated before interceptors run. When authentication comes from interceptor closures, create a new request entry point on account changes or explicitly include authentication in request configuration. Cache keys cannot infer closure state.

## Read defaults

```ts
const defaults = api.getDefaultConfig()
```

Returns a deep copy of wrapper defaults without `maxRetry`. These are the defaults supplied at construction or reset time, not necessarily the current `instance.defaults`.

## Reset defaults

```ts
api.setDefaultConfig({ baseURL: '/api/v2', timeout: 8000 })
```

Replaces the entire default configuration instead of merging it with the old one. In instance mode, Axios is recreated and **existing interceptors are reset**. Register them again. This preserves the legacy behavior.

Identical configurations can still reuse cached results. Requests already sent, including their waiting callers, can complete after a reset.

## Modify instance defaults directly

```ts
api.instance!.defaults.headers.common['X-Tenant'] = 'tenant-b'
```

The current cache key includes instance defaults so changing a tenant header does not accidentally reuse another tenant's cached response. Directly modifying instance defaults does not alter the value returned by `getDefaultConfig()`.

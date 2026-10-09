# Axios 实例与配置

## 选择实例模式

```ts
const shared = new VmoRequest({ baseURL: '/api' })
console.log(shared.instance) // null

const api = new VmoRequest({ baseURL: '/api' }, true)
console.log(api.instance) // Axios 实例
```

默认模式通过 Axios 的全局入口发送请求。实例模式通过单独创建的 Axios 实例发送请求，适合需要独立拦截器的应用。

## 添加拦截器

```ts
api.instance!.interceptors.request.use(config => {
  config.headers.set('X-Client', 'web')
  return config
})

api.instance!.interceptors.response.use(response => response.data)

const users = await api.request({ url: '/users' })
// users 是业务数据，不再是完整 AxiosResponse
```

缓存键在拦截器执行前生成。若认证信息来自拦截器闭包，账号切换时应创建新的请求入口，或在请求配置中显式携带认证信息；不能假设缓存键会感知闭包状态。

## 读取默认配置

```ts
const defaults = api.getDefaultConfig()
```

返回默认配置的深拷贝，且不包含 `maxRetry`。它反映构造或重置时的包装器默认配置，不等同于当前 `instance.defaults`。

## 重置默认配置

```ts
api.setDefaultConfig({ baseURL: '/api/v2', timeout: 8000 })
```

替换整个默认配置，不与旧配置合并。实例模式会重建 Axios 实例，**原拦截器会被重置**；需要重新注册。此行为保留自旧版。

相同配置仍可复用缓存。已发送请求及其等待者可以继续完成，不会因更新配置而丢失。

## 直接修改实例默认值

```ts
api.instance!.defaults.headers.common['X-Tenant'] = 'tenant-b'
```

当前实现的缓存键包含实例默认配置，避免不同租户默认头错误命中同一条缓存。直接修改实例默认值不会改变 `getDefaultConfig()` 的结果。

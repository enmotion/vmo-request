# API 文档

```ts
import { VmoRequest } from 'vmo-request'
import type { RequestProps } from 'vmo-request'
```

## 构造函数

```ts
new VmoRequest(
  config: Partial<AxiosRequestConfig & { maxRetry: number }>,
  createInstance: boolean = false
)
```

| 参数 | 描述 |
| --- | --- |
| `config` | 默认 Axios 配置，可附带 `maxRetry`，默认重试上限为 9 |
| `createInstance` | 是否创建独立 Axios 实例，默认 `false` |

实例创建失败时抛出 `TypeError('new VmoRequest: with wrong params')`。

## request

```ts
request(
  config: Partial<AxiosRequestConfig>,
  expiredTime: number = 0,
  retry: number = 0,
  retryDelay: number = 0
): Promise<any>
```

| 参数 | 描述 |
| --- | --- |
| `config` | 请求配置，与包装器默认配置深度合并 |
| `expiredTime` | 缓存时间（毫秒）；负值独立请求，0 仅合并，正值合并并缓存 |
| `retry` | 重试次数，受默认配置的 `maxRetry` 限制 |
| `retryDelay` | 固定重试延迟（毫秒），负值取绝对值 |

默认解析为 Axios 响应；响应拦截器可以返回业务数据。失败时拒绝为原始错误，调用方使用 `try/catch` 或 `.catch()` 处理。

## instance

```ts
get instance(): AxiosInstance | null
```

仅 `createInstance = true` 时返回 Axios 实例；否则返回 `null`。可以注册拦截器、修改 Axios 默认配置。

## getDefaultConfig

```ts
getDefaultConfig(): Partial<AxiosRequestConfig>
```

返回包装器默认配置的深拷贝，不包含 `maxRetry`。不直接返回当前实例的 `defaults`。

## setDefaultConfig

```ts
setDefaultConfig(
  config: Partial<AxiosRequestConfig & { maxRetry: number }>
): boolean
```

成功返回 `true`。替换整个配置；若已创建 Axios 实例，将重建实例并重置拦截器。失败时抛出 `TypeError('setDefaultConfig with wrong params')`。当前修复确保失败更新不破坏原配置。

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

这个类型用于组织应用自己的接口定义。`request()` 接受的是 Axios 配置，不会自动解析 RequestProps 对象。

`middlConfig` 保留现有拼写，是数据字段；当前库没有中间件注册或 `next()` 执行接口，不会自动执行这个字段。

## 不提供的接口

当前没有 `clearCache()`、中间件注册、缓存订阅、公开请求状态或指数退避配置。请不要把内部实现状态当成稳定的公开 API。

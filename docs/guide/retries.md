# 重试与取消

## 设置重试次数和延迟

```ts
const api = new VmoRequest({ baseURL: '/api', maxRetry: 3 })

await api.request({ url: '/users' }, 0, 2, 500)
// 初次请求失败后，最多重试两次，每次等待 500 ms
```

默认 `retry = 0`，不重试。默认 `maxRetry = 9`，实际重试次数不超过请求的 `retry` 与默认配置的上限。两者均为非负整数时，总尝试次数最多为 `1 + Math.min(retry, maxRetry)`。

`retryDelay` 是固定延迟，不是指数退避；负值取绝对值。当前实现会约束无效次数和非有限延迟，详见[升级说明](./upgrade)。

## 哪些失败会重试

为兼容旧版，普通失败仍会按次数重试，包括 4xx、5xx 和网络错误。没有自动排除 POST，也没有自动读取 `Retry-After`。

主动取消的请求不会继续重试。合并组内只有一个实际执行过程，等待者共用其最终成功或失败结果。

::: warning 重复写入
服务端可能已经处理写请求，但客户端未收到响应。重试可能造成重复写入。对支付、下单等接口使用服务端幂等键，或保持 `retry = 0`。
:::

## 使用 AbortController

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
    console.log('请求已取消')
  } else {
    throw error
  }
}
```

示例需 `import axios from 'axios'`。不同 signal 的请求不会因配置其他部分相同而错误合并。使用同一个 signal 的调用共享取消行为。

已取消的 signal 不会命中成功缓存。等待重试延迟时取消，当前可能等到延迟结束才返回取消结果；取消后的请求不会继续重试。

## 兼容 CancelToken

```ts
const source = axios.CancelToken.source()
const pending = api.request({ url: '/users', cancelToken: source.token })
source.cancel('页面已离开')
await pending.catch(error => {
  if (!axios.isCancel(error)) throw error
})
```

保留 CancelToken 用于旧项目；新项目建议使用 AbortController。

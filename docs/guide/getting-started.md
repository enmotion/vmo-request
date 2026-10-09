# 快速开始

VmoRequest 在 Axios 请求之上提供并发合并、结果缓存和重试。它不依赖 React、Vue 等 UI 框架；可以在浏览器或 Node.js 中使用。

## 安装

```sh
npm install vmo-request axios ramda md5
```

Axios、Ramda 和 MD5 是运行时的 peer dependencies。文档工具 VitePress 只用于开发，不是库的运行时依赖。

## 创建请求入口

使用**命名导出**，不是默认导出。

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

默认情况下返回 Axios 响应。响应拦截器可以改变返回形态，因此公开返回类型保留为 `Promise<any>`。

## 一个方法，四个参数

```ts
await api.request(
  { url: '/users', method: 'get' },
  2000, // 结果缓存 2 秒
  2,    // 最多重试 2 次，加上初次请求最多 3 次
  300   // 两次尝试之间等待 300 毫秒
)
```

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `config` | 必填 | Axios 请求配置，与默认配置深度合并 |
| `expiredTime` | `0` | 负值关闭合并；0 仅合并；正值设置结果缓存 TTL |
| `retry` | `0` | 重试次数，受 `maxRetry` 限制 |
| `retryDelay` | `0` | 固定重试延迟，单位毫秒 |

## 共享一个实例

```ts
// api.ts
export const api = new VmoRequest({ baseURL: '/api' })

// 不同调用者使用同一入口
const [first, second] = await Promise.all([
  api.request({ url: '/users' }, 2000),
  api.request({ url: '/users' }, 2000)
])

console.log(first === second) // true
```

缓存和等待队列属于每个 VmoRequest 实例。分别创建的实例不会互相合并。

接下来阅读[缓存与请求合并](./caching)或[完整 API](/api/)。

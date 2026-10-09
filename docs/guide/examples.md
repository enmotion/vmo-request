# 实用示例

以下示例使用共享入口。实际项目请根据后端地址、认证方式与错误格式调整。

## 共享列表查询

```ts
import { VmoRequest } from 'vmo-request'

const api = new VmoRequest({ baseURL: '/api', timeout: 5000 })
const getUsers = () => api.request({ url: '/users' }, 2000, 1, 300)

const [sidebar, page] = await Promise.all([getUsers(), getUsers()])
console.log(sidebar.data, page.data)
```

仅当请求配置相同、使用同一入口时合并。失败结果也可能在这 2 秒内缓存。

## 每次提交独立执行

```ts
const result = await api.request({
  url: '/orders',
  method: 'post',
  data: { productId: 'p-001', quantity: 1 }
}, -1, 0)
```

负缓存时间关闭合并，重试次数为 0。服务端的幂等机制仍由应用负责。

## 显式传入身份信息

```ts
async function getProfile(token: string) {
  return api.request({
    url: '/profile',
    headers: { Authorization: `Bearer ${token}` }
  }, 1000)
}
```

请求头参与键生成，不同 token 不会共享同一条结果缓存。SSR 服务端可为每个用户请求创建独立入口，避免跨用户共享缓存。

## 上传表单

```ts
const data = new FormData()
data.append('title', 'report')
data.append('file', file) // file 来自上传控件

await api.request({ url: '/files', method: 'post', data }, -1)
```

通常无需手动指定 multipart boundary，由 Axios 和运行环境处理。

## 自己组织接口定义

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

`middlConfig` 由应用解释，库不会自动运行它。完整取消示例见[重试与取消](./retries)。

# vmo-request

`VmoRequest` 是一个基于 Axios 的请求工具类，旨在提供请求的缓存、状态管理和配置合并等功能。它特别适合需要在应用中频繁进行相同请求的场景，通过缓存机制可以有效减少服务器负载并提升应用性能。

### 功能特性

- 缓存机制：通过对请求配置进行 MD5 哈希处理，缓存请求结果，避免重复请求。
- 状态管理：支持 PENDING、FULFILLED 和 REJECTED 三种状态管理，确保请求状态的一致性。
- 配置合并：通过 mergeDeepRight 方法合并默认配置和用户配置，避免配置覆盖问题。
- 过期时间：支持设置缓存过期时间，自动清理过期缓存。

### 安装

```nodejs
npm install axios ramda md5
```
### 使用示例

```javascript
import VmoRequest from './VmoRequest'
import axios from 'axios'

const vmoRequest = new VmoRequest({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
})

async function fetchData() {
  try {
    const response = await vmoRequest.request({
      url: '/data',
      method: 'get'
    }, 1000 * 60) // 缓存 1 分钟
    console.log(response.data)
  } catch (error) {
    console.error(error)
  }
}

fetchData()
```

### API 文档

VmoRequest 类
构造函数

```javascript
const vmoRequest = new VmoRequest({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

`getDefaultConfig` 方法

```javascript
vmoRequest.getDefaultConfig() // Partial<AxiosRequestConfig>
```
- 返回值:
  - 返回当前的默认配置。

`setDefaultConfig` 方法
```javascript
vmoRequest.setDefaultConfig(config: Partial<AxiosRequestConfig>): boolean
```
- 参数:
  - config: 新的默认配置。
- 返回值:
  - 返回 true 表示配置更新成功。

`request` 方法
```javascript
vmoRequest.request(config: Partial<AxiosRequestConfig>, expiredTime: number = 0): Promise<any>
```
- 参数:
  - config: 用户的 Axios 配置。
  - expiredTime: 缓存过期时间（毫秒），默认为 0（不缓存）。
- 返回值:
  - 返回一个 Promise，解析为请求的响应数据，或拒绝为错误数据。
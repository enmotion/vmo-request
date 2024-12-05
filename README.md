# vmo-request

`VmoRequest` 是一个基于 Axios 的请求工具类，旨在提供请求的缓存、状态管理和配置合并等功能。它特别适合需要在应用中频繁进行相同请求的场景，通过缓存机制可以有效减少服务器负载并提升应用性能。

### 功能特性

- 缓存机制：通过对请求配置进行 MD5 哈希处理，缓存请求结果，避免重复请求。
- 重试机制：应对网络或接口的不稳定，可以自行设置重试机制，提升请求的成功率
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
    const response = await vmoRequest.request(
      {
        url: '/data',
        method: 'get'
      },
      1000 * 60, // 缓存 1 分钟
      3 // 重试3次 一共请求4次
    )
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
console.log(!!vmRequest.instance) // false

// 生成实例的构建模式
const vmoRequest = new VmoRequest(
  {
    baseURL: 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  true
)
console.log(!!vmRequest.instance) // true

vmoRequest.instance // 伴随创建的 axios 实例
```

- new VmoRequest(config,createInstance)参数:
  - config: 默认配置。
  - createInstance: 是否需要伴随创建一个 axios 实例 默认:false

`getDefaultConfig` 获取当前默认配置

```javascript
vmoRequest.getDefaultConfig() // Partial<AxiosRequestConfig>
```

- 返回值:
  - 返回当前的默认配置。

`setDefaultConfig` 重置当前默认配置

```javascript
vmoRequest.setDefaultConfig(config: Partial<AxiosRequestConfig>): boolean
```

- 参数:
  - config: 新的默认配置。
- 返回值:
  - 返回 true 表示配置更新成功。

`request` 方法

```javascript
vmoRequest.request(config: Partial<AxiosRequestConfig>, expiredTime: number = 0, retryTimes:number=0): Promise<any>
```

- 参数:
  - config: 用户的 Axios 配置。
  - expiredTime: 缓存过期时间（毫秒），默认为 0（不缓存）但在同一个事件循环中发起的请求依然会执行队列合并的方式，但是如果设置为-1,则不会有任何的合并行为，会被视为普通请求，以应对某些特殊场景。
  - retryTimes: 重试次数，默认为 0（不重试）。
- 返回值:
  - 返回一个 Promise，解析为请求的响应数据，或拒绝为错误数据。

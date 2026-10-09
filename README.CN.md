# vmo-request

基于 Axios 的请求工具，提供并发请求合并、短期结果缓存和可控重试，不依赖 UI 框架。

[中文文档](https://enmotion.github.io/vmo-request/) · [English documentation](https://enmotion.github.io/vmo-request/en/) · [源码中的指南](docs/guide/getting-started.md)

在线文档在启用 GitHub Pages 工作流并完成部署后可用。当前源码包含尚未发布的可靠性修复，详见[升级与兼容性](docs/guide/upgrade.md)。

## 安装

```sh
npm install vmo-request axios ramda md5
```

## 使用

```ts
import { VmoRequest } from 'vmo-request'

const api = new VmoRequest({ baseURL: '/api', timeout: 5000 })
const response = await api.request(
  { url: '/users', method: 'get' },
  2000, // 缓存 2 秒
  2,    // 最多重试 2 次
  300   // 固定重试延迟，单位毫秒
)
console.log(response.data)
```

`expiredTime < 0` 关闭缓存与合并；`0` 仅合并等待中的请求；正值缓存成功或普通失败结果。相同配置的 POST 也会合并，组内共享首次调用的策略和结果引用。

`createInstance = true` 时，`instance` 暴露 Axios 实例供注册拦截器。`setDefaultConfig()` 替换默认配置并重建实例，会重置拦截器。

## 开发

```sh
npm ci
npm run check       # 库构建、API/产物检查、测试与四项 100% 覆盖率门槛
npm run docs:dev    # 双语文档开发
npm run docs:check  # 文档类型检查与静态构建
npm run docs:preview
```

GitHub Pages 设置见[文档开发与部署](docs/guide/deployment.md)，完整兼容边界见 [UPGRADE.md](UPGRADE.md)。

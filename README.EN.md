# vmo-request

An Axios request utility for concurrent deduplication, short-lived result caching, and configurable retries. Independent of UI frameworks.

[English documentation](https://enmotion.github.io/vmo-request/en/) · [中文文档](https://enmotion.github.io/vmo-request/) · [Source guides](docs/en/guide/getting-started.md)

The documentation URL becomes available after the GitHub Pages workflow is enabled and deployed. Current source includes unreleased reliability fixes; see [upgrade compatibility](docs/en/guide/upgrade.md).

## Install

```sh
npm install vmo-request axios ramda md5
```

## Use

```ts
import { VmoRequest } from 'vmo-request'

const api = new VmoRequest({ baseURL: '/api', timeout: 5000 })
const response = await api.request(
  { url: '/users', method: 'get' },
  2000, // Cache for 2 seconds
  2,    // Up to 2 retries
  300   // Fixed retry delay in milliseconds
)
console.log(response.data)
```

`expiredTime < 0` disables caching and deduplication; `0` deduplicates pending calls; positive values cache successful or ordinary failed results. Matching POST calls also deduplicate. Calls share the first caller's policy and result reference.

With `createInstance = true`, `instance` exposes Axios for interceptors. `setDefaultConfig()` replaces defaults and recreates the instance, resetting its interceptors.

## Development

```sh
npm ci
npm run check       # Library build, API/package checks, tests, 100% coverage gates
npm run docs:dev    # Bilingual documentation development
npm run docs:check  # Documentation type check and static build
npm run docs:preview
```

See [documentation deployment](docs/en/guide/deployment.md) for GitHub Pages settings and [UPGRADE.md](UPGRADE.md) for detailed compatibility boundaries.

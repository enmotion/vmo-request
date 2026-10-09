# Upgrade compatibility

This page distinguishes the original 0.0.9 implementation in the repository from the current, unreleased reliability fixes. The version in `package.json` has not changed; that does not mean the fixes have been published to npm.

## Preserved behavior

- Export names, constructor arguments, and the `request(config, expiredTime, retry, retryDelay)` argument order.
- `instance`, `getDefaultConfig()`, `setDefaultConfig()`, and the permissive `Promise<any>` return type.
- POST deduplication, ordinary error caching, first-caller policies, and the zero-TTL distribution window.
- Nine retries by default, retries for ordinary 4xx/5xx errors, fixed delays, and absolute values for negative delays.
- Shared result references and TTL measured from distribution time.
- Replacing defaults recreates an existing instance and resets interceptors.

## Intentional fixes

| Scenario | Original 0.0.9 implementation | Current source |
| --- | --- | --- |
| Negative TTL, non-instance mode | Could lose default configuration | Uses fully merged defaults |
| Forms, binary data, function configuration | JSON serialization could omit information | Content or identity participates in keys |
| Direct instance header updates | Cache key did not reflect changes | Instance defaults participate in keys |
| Cancellation | Could retry or cache cancellation errors | No cancellation retries or retained cancellation errors |
| Aborted signal hitting a cache | Could return cached success | Rejects with cancellation |
| Failed instance reset | Could overwrite original defaults | Preserves configuration and instance |
| Invalid retry counts | Could produce uncontrolled attempts | Bounded to finite non-negative integers |

These fixes intentionally change faulty behavior. They do not promise identical execution semantics in every case.

## Upgrading an existing application

1. Install the new version in a test environment once it is released, retaining your current Axios version.
2. Check authentication headers, tenant switching, interceptor return values, and interceptor registration after `setDefaultConfig()`.
3. Review which write operations need independent execution and whether retries are appropriate.
4. Verify application handling of cached failures, cancellation, and cache hits.
5. Roll out gradually after application integration tests pass.

## Verification

The repository includes source comparisons against the legacy implementation, TypeScript API checks, and ESM/CJS package checks. Statements, branches, functions, and lines in the library entry point and core source are all covered at 100%, with matching enforced thresholds.

```sh
npm run check
```

Complete source coverage does not cover every application environment. Use the generated report for current results. Documentation builds do not change the library's runtime API.

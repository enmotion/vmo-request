# FAQ

## Why is there only one network request with a TTL of zero?

Zero disables long-lived result caching, not in-flight deduplication. The entry is removed after the distribution window; later calls send another request. Use -1 when every call must execute independently.

## Why does the next call still fail?

A positive TTL caches ordinary failures. It does not automatically refresh within that lifetime. Lower the TTL or use a negative value for independent execution. The current fixes do not retain cancellation errors as ordinary cached failures.

## Is this a state manager or onion middleware framework?

The current public API is a request wrapper. It tracks internal request state but has no state subscription, `use()`, or `next()` middleware composition interface. `RequestProps.middlConfig` is an application data field.

## Does deduplication work across tabs or server processes?

No. Caching and concurrent coordination belong to the current VmoRequest instance. There is no distributed lock or persistent storage.

## Can I manually clear the cache?

There is no public clearing interface. Create a new instance for an independent cache, or use a negative cache lifetime to bypass it for a call.

## Are results deeply copied?

No. Waiting callers and cache hits share the original result reference.

## Why is the TypeScript return type any?

This preserves existing response interceptors that return application data. Applications can declare return types in their own endpoint layer. The library does not currently provide a generic `request<T>()` interface.

## Why can the docs differ from an npm release?

The site describes repository source, including unreleased reliability fixes. Check [upgrade compatibility](./upgrade). Deploying the documentation is separate from publishing a new npm version.

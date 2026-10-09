---
layout: home
markdownStyles: false
hero:
  name: vmo-request
  text: Share execution.<br>Skip duplicate work.
  tagline: An Axios utility for concurrent request deduplication, short-lived caching, and configurable retries. Keep the API you know.
  image:
    src: /logo.svg
    alt: vmo-request
  actions:
    - theme: brand
      text: Get started
      link: /en/guide/getting-started
    - theme: alt
      text: API reference
      link: /en/api/
features:
  - title: Deduplicate concurrent calls
    details: Calls with the same configuration share one execution and its result, even with a cache lifetime of zero.
  - title: Cache on your terms
    details: Set a TTL in milliseconds for successful or ordinary failed results. A negative value disables caching and deduplication.
  - title: Control retries
    details: Configure retry counts, a fixed delay, and a global limit. Cancelled requests are not retried.
---

<RequestFlow />

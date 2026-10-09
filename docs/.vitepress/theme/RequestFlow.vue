<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
const { lang } = useData()
const en = computed(() => lang.value === 'en')
const mode = ref(0)
const options = computed(() => en.value ? ['Merge only', 'Cache for 2s', 'Independent'] : ['仅合并', '缓存 2 秒', '独立请求'])
const description = computed(() => en.value
  ? ['Three concurrent calls share one execution. A later call sends a new request.', 'Concurrent calls share one execution. A later call within the TTL uses its result.', 'Each call sends its own request. Caching and deduplication are disabled.'][mode.value]
  : ['三个并发调用共用一次执行。等待窗口结束后，后续调用重新发送请求。', '并发调用共用一次执行。缓存有效期内，后续调用直接使用结果。', '每次调用独立发送请求，关闭缓存和请求合并。'][mode.value])
</script>

<template>
  <section class="request-flow" :aria-label="en ? 'Request behavior illustration' : '请求行为示意'">
    <div class="flow-heading">
      <div><span class="flow-eyebrow">REQUEST → RESULT</span><h2>{{ en ? 'One API. Three modes.' : '一个入口，三种模式。' }}</h2></div>
      <span class="flow-caption">{{ en ? 'Illustration · no network calls' : '行为示意 · 不发送真实请求' }}</span>
    </div>
    <div class="flow-controls" role="group" :aria-label="en ? 'Choose cache mode' : '选择缓存模式'">
      <button v-for="(option, index) in options" :key="index" :aria-pressed="mode === index" :class="{ active: mode === index }" @click="mode = index">{{ option }}</button>
    </div>
    <div class="flow-diagram">
      <div class="flow-calls"><span v-for="n in 3" :key="n"><i></i>{{ en ? 'Caller' : '调用' }} {{ n }}<code>GET /users</code></span></div>
      <div class="flow-arrow" aria-hidden="true">→</div>
      <div class="flow-core"><img :src="withBase('/logo.svg')" alt="" width="36" height="36"><strong>VmoRequest</strong><code>expiredTime: {{ [0, 2000, -1][mode] }}</code></div>
      <div class="flow-arrow" aria-hidden="true">→</div>
      <div class="flow-result"><strong>{{ mode === 2 ? '3' : '1' }}</strong><span>{{ en ? 'network request(s)' : '次网络请求' }}</span><small>{{ en ? 'Successful first attempts' : '首次请求均成功时' }}</small></div>
    </div>
    <p class="flow-description" aria-live="polite">{{ description }}</p>
  </section>
</template>

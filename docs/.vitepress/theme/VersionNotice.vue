<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
const { lang } = useData()
const en = computed(() => lang.value === 'en')
</script>
<template>
  <aside class="version-notice" role="note">
    <span>{{ en ? 'Current source · unreleased fixes' : '当前源码 · 修复尚未发布' }}</span>
    {{ en ? 'These docs include reliability changes beyond the original 0.0.9 implementation.' : '本文档包含原 0.0.9 实现之后的可靠性修复。' }}
    <a :href="withBase(en ? '/en/guide/upgrade.html' : '/guide/upgrade.html')">{{ en ? 'Compatibility notes →' : '查看兼容性说明 →' }}</a>
  </aside>
</template>

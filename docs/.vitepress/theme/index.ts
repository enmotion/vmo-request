import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import VersionNotice from './VersionNotice.vue'
import RequestFlow from './RequestFlow.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'doc-before': () => h(VersionNotice),
    'home-hero-before': () => h(VersionNotice)
  }),
  enhanceApp({ app }) { app.component('RequestFlow', RequestFlow) }
} satisfies Theme

import { defineConfig } from 'vitepress'

// GitHub Actions supplies the actual repository. Local builds use the project slug.
const repository = process.env.GITHUB_REPOSITORY
const slug = repository?.split('/')[1] ?? 'vmo-request'
const base = process.env.DOCS_BASE || (slug.endsWith('.github.io') ? '/' : `/${slug}/`)
const source = `https://github.com/${repository ?? 'enmotion/vmo-request'}`
const sidebar = (en = false) => {
  const prefix = en ? '/en' : ''
  return [
    { text: en ? 'Guide' : '使用指南', items: [
      { text: en ? 'Getting started' : '快速开始', link: `${prefix}/guide/getting-started` },
      { text: en ? 'Caching & deduplication' : '缓存与请求合并', link: `${prefix}/guide/caching` },
      { text: en ? 'Retries & cancellation' : '重试与取消', link: `${prefix}/guide/retries` },
      { text: en ? 'Axios instances' : 'Axios 实例与配置', link: `${prefix}/guide/axios-instance` },
      { text: en ? 'Examples' : '实用示例', link: `${prefix}/guide/examples` }
    ] },
    { text: en ? 'Reference' : '参考', items: [
      { text: en ? 'API reference' : 'API 文档', link: `${prefix}/api/` },
      { text: en ? 'Upgrade compatibility' : '升级与兼容性', link: `${prefix}/guide/upgrade` },
      { text: en ? 'FAQ' : '常见问题', link: `${prefix}/guide/faq` },
      { text: en ? 'Documentation deployment' : '文档开发与部署', link: `${prefix}/guide/deployment` }
    ] }
  ]
}

export default defineConfig({
  title: 'vmo-request',
  base,
  cleanUrls: false,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }]],
  // Keep the documentation independent of the library demo's Tailwind pipeline.
  vite: { css: { postcss: { plugins: [] } } },
  locales: {
    root: {
      label: '简体中文', lang: 'zh-CN',
      description: '基于 Axios 的请求合并、短期缓存与可控重试工具。',
      themeConfig: {
        nav: [{ text: '指南', link: '/guide/getting-started' }, { text: 'API', link: '/api/' }, { text: '升级说明', link: '/guide/upgrade' }],
        sidebar: sidebar(),
        outline: { label: '本页目录', level: [2, 3] },
        docFooter: { prev: '上一页', next: '下一页' },
        returnToTopLabel: '返回顶部', sidebarMenuLabel: '目录', darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式', darkModeSwitchTitle: '切换到深色模式',
        langMenuLabel: '选择语言', skipToContentLabel: '跳转到正文',
        footer: { message: '基于 Axios · 框架无关 · 保留熟悉的调用方式' }
      }
    },
    en: {
      label: 'English', lang: 'en',
      description: 'An Axios utility for request deduplication, short-lived caching, and configurable retries.',
      themeConfig: {
        nav: [{ text: 'Guide', link: '/en/guide/getting-started' }, { text: 'API', link: '/en/api/' }, { text: 'Upgrade', link: '/en/guide/upgrade' }],
        sidebar: sidebar(true), outline: { label: 'On this page', level: [2, 3] },
        footer: { message: 'Built on Axios · Framework independent · Familiar API' }
      }
    }
  },
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [{ icon: 'github', link: source }],
    nav: [],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: { translations: {
            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
            modal: { displayDetails: '显示详细结果', resetButtonTitle: '清除搜索', backButtonTitle: '返回', noResultsText: '没有找到相关结果', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } }
          } }
        }
      }
    }
  }
})

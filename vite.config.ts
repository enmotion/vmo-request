/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import ignorePlugin from 'rollup-plugin-ignore'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({ copyDtsFiles: true })],
  server: {
    host: '0.0.0.0',
    port: 1980
  },
  test: {
    environment: 'jsdom',
    coverage: {
      include: ['**/use.lib'],
      provider: 'v8',
      reportsDirectory: './test/reports/unit/coverage'
    }
  },
  build: {
    // Vite 模块打包模式 配置
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'vmo-request',
      fileName: 'vmo-request'
    },
    rollupOptions: {
      external: ['ramda', 'md5', 'axios'],
      plugins: [
        // 忽略 'src/some-file.js' 文件
        ignorePlugin(['src/main.ts'])
      ],
      output: {
        globals: {
          ramda: 'ramda',
          axios: 'axios',
          md5: 'md5'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'), // 用于开发的 src 文件夹
      '@type': resolve(__dirname, 'types'), // ts 描述文件夹
      '@comps': resolve(__dirname, 'components'), // 组件模块文件夹
      '@lib': resolve(__dirname, 'use.lib') // 文件模块文件夹
    }
  }
})

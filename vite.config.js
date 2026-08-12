import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { createHighlighter } from 'shiki'
import markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'

const highlighter = await createHighlighter({
  langs: ['json', 'text', 'vue'],
  themes: ['github-light'],
})

const bundleVisualizer = {
  ...visualizer({
    filename: 'bundle-report.html',
    title: '@chatwoot/viz bundle analysis',
    gzipSize: true,
    brotliSize: true,
  }),
  enforce: 'post',
  apply(_config, { command, mode }) {
    return command === 'build' && mode === 'analyze'
  },
}

export default defineConfig({
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    markdown({
      markdownOptions: {
        highlight(code, language) {
          const lang = highlighter.getLoadedLanguages().includes(language) ? language : 'text'

          return highlighter.codeToHtml(code, { lang, theme: 'github-light' })
        },
      },
    }),
    bundleVisualizer,
  ],
  build: {
    // https://vite.dev/guide/build.html#library-mode
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      formats: ['es'],
      fileName: 'chatwoot-viz',
    },
    rolldownOptions: {
      external: ['vue'],
    },
  },
})

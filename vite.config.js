import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue({ include: [/\.vue$/, /\.md$/] }), markdown()],
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

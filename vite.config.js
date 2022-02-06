import { defineConfig } from 'vite'
import { resolve } from 'path'
import eslintPlugin from 'vite-plugin-eslint'

// env
const env = require('dotenv').config().parsed
const isProd = env.NODE_ENV === 'production'

let outDir = env.APP_BUILD_DIR || 'public'

// Prevents to output app files outside of the project root.
if (outDir.includes('../')) {
  throw new Error('APP_BUILD_DIR (in the .env file) can’t point to an upper-level directory. Remove all `../`.')
}

// helper to root project path
const thePath = (path = '') => resolve(__dirname, path)

// ESLint Options
const esLintOptions = {
  cache: true, // cache is cleaned on `npm install`
  cacheStrategy: 'content',
  fix: env.ES_LINT_AUTOFIX == 'true',
  formatter: env.ES_LINT_FORMATTER ?? 'stylish',
}

export default defineConfig({
  root: 'src',
  build: {
    envDir: './',
    outDir: `../${outDir}`,
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        app: thePath('./src/index.html'),
        components: thePath('./src/components.html'),
      },
      // external: [
      //   // 'css/vendor/style.css',
      //   // '$',
      //   // 'instruments/acoustic-grand-piano-mp3.js',
      //   // 'js/vendor/verovio-toolkit-wasm.js',
      // ],
    }
  },
  // envPrefix: ['VITE_'],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [
    ...(isProd ? [] : [eslintPlugin(esLintOptions)]),
  ],
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import wasm from 'vite-plugin-wasm'
import basicSsl from '@vitejs/plugin-basic-ssl'

const packages = ['strudel-flow', 'strudel-editor']
// The leading dot allows cnotv.xyz and every subdomain, since a `vite preview` container
// rejects any Host header it does not list.
const allowedHosts = ['.cnotv.xyz']

const packageAliases = Object.fromEntries(
  packages.map((package_) => [
    `@webgamekit/${package_}`,
    fileURLToPath(new URL(`./packages/${package_}/src/index.ts`, import.meta.url))
  ])
)

// The device orientation and fullscreen APIs only work in a secure context, so reaching the
// dev server from a phone over the LAN needs HTTPS. Opt in with VITE_HTTPS=1 (pnpm dev:mobile)
// rather than always, since the self-signed certificate costs a browser warning on every start.
const useHttps = process.env.VITE_HTTPS === '1'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [vue(), wasm(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ...Object.entries(packageAliases).map(([find, replacement]) => ({ find, replacement })),
      // @strudel/midi's source reaches superdough through a monorepo-only relative path.
      {
        find: /^\.\.\/superdough\/helpers\.mjs$/,
        replacement: fileURLToPath(
          new URL('./packages/strudel-editor/src/editor/strudelMidiScheduling.ts', import.meta.url)
        )
      }
    ],
    dedupe: ['three']
  },
  css: {
    preprocessorOptions: {
      // Use Dart Sass's modern compiler API; the default legacy JS API is
      // deprecated (https://sass-lang.com/d/legacy-js-api) and removed in Sass 2.
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  worker: {
    // Vite's default worker format is `iife`, which cannot code-split and so would inline
    // the HEIF decoder into the converter worker for everyone. ES workers let it stay a
    // separate chunk, fetched only when a HEIF file actually turns up.
    format: 'es'
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      treeshake: false
    }
  },
  optimizeDeps: {
    // @strudel/midi stays out of pre-bundling so the alias above can reach its relative import.
    exclude: ['@strudel/midi']
  },
  server: {
    allowedHosts
  },
  preview: {
    allowedHosts
  }
})

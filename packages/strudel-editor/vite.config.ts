import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import packageManifest from './package.json'

// @strudel/midi imports superdough through a path that only exists in Strudel's own monorepo,
// so it is bundled here, where the alias below fixes it, rather than left for the host to resolve.
const externalPackageNames = [
  ...Object.keys(packageManifest.dependencies),
  ...Object.keys(packageManifest.peerDependencies)
]

const isExternal = (moduleId: string): boolean =>
  externalPackageNames.some(
    (packageName) => moduleId === packageName || moduleId.startsWith(`${packageName}/`)
  )

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // @strudel/midi's source reaches superdough through a monorepo-only relative path.
      {
        find: /^\.\.\/superdough\/helpers\.mjs$/,
        replacement: resolve(import.meta.dirname, 'src/editor/strudelMidiScheduling.ts')
      }
    ]
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        helpers: resolve(import.meta.dirname, 'src/helpers.ts')
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: isExternal
    }
  },
  worker: {
    format: 'es'
  }
})

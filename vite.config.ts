import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages serves any unknown path with 404.html and has no rewrites, so a
// deep link such as /meal-plan/month/2026-09 never reaches index.html. Shipping
// a copy of index.html under that name boots the SPA and lets the router take
// over from the URL it was asked for.
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves a project site from a path named after the repository.
  base: '/meal-plan/',
  plugins: [react(), tailwindcss(), spaFallback()],
})

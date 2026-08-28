import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: { include: ['lib/**/*.test.ts'] },
  resolve: { alias: { '@': resolve(import.meta.dirname, '.') } },
})

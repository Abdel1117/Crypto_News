import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ['text', 'lcov'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.cjs',
        '**/postcss.config.mjs',
        '**/vitest.config.mts',
        '**/*.json',
        'app/**/*.test.{ts,tsx}',
      ],
    },
    environment: 'jsdom',
    setupFiles: ["./vitest.setups.ts"],
    pool: "threads",
  },
})

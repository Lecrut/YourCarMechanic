import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { sharedAlias, sharedOptimizeDeps, sharedPlugins } from './.storybook/vite.shared.ts'

const configDir = fileURLToPath(new URL('./.storybook', import.meta.url))

export default defineConfig({
  resolve: { alias: sharedAlias },
  // No @vitejs/plugin-vue here: .storybook/main.ts adds it (unit tests are plain TS).
  plugins: sharedPlugins(false),
  optimizeDeps: sharedOptimizeDeps,
  test: {
    projects: [
      {
        // Pure domain logic (pricing, stats, clients…) – fast, no browser.
        extends: true,
        test: {
          name: 'unit',
          include: ['app/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Every Storybook story is rendered in Chromium and its `play` function runs as a test.
        extends: true,
        plugins: [storybookTest({ configDir })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            // Desktop by default; phone stories set `globals.viewport` (Storybook resizes the frame).
            viewport: { width: 1280, height: 800 },
          },
        },
      },
    ],
  },
})

import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'
import { sharedAlias, sharedOptimizeDeps, sharedPlugins } from './vite.shared.ts'

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|mdx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/vue3-vite',
    options: { docgen: 'vue-component-meta' },
  },
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    // @vitejs/plugin-vue: the framework does not always add it (production build on Vite 8),
    // so add it unless present – SFCs must not be compiled twice.
    const hasVue = (viteConfig.plugins ?? []).flat(Infinity)
      .some(p => p && typeof p === 'object' && 'name' in p && p.name === 'vite:vue')
    return mergeConfig(viteConfig, {
      resolve: { alias: sharedAlias },
      plugins: sharedPlugins(!hasVue),
      optimizeDeps: sharedOptimizeDeps,
    })
  },
}

export default config

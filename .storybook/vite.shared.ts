import { fileURLToPath } from 'node:url'
import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import AutoImport from 'unplugin-auto-import/vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * Makes Nuxt app code runnable outside Nuxt (Storybook + Vitest):
 * - `~/services` → in-memory fake (no Firebase in stories/tests)
 * - Nuxt auto-imports (ref, computed, stores, utils, useI18n, navigateTo…) recreated
 */
export const sharedAlias = [
  { find: /^~\/services$/, replacement: r('./mocks/services.ts') },
  { find: /^~\//, replacement: `${r('../app')}/` },
  { find: /^#app$/, replacement: r('./mocks/nuxt.ts') },
]

/**
 * Vuetify is registered globally in preview.ts (all components + directives) instead of
 * auto-imported per component – one pre-bundled module keeps Vite from reloading mid-test.
 */
export const sharedOptimizeDeps = {
  include: ['vuetify', 'vuetify/components', 'vuetify/directives', 'vuetify/locale', 'maplibre-gl', 'vue-i18n', 'pinia', 'vue-router', 'firebase/firestore'],
}

export function sharedPlugins(withVue = true): PluginOption[] {
  return [
    ...(withVue ? [vue()] : []),
    vuetify({ autoImport: false }),
    AutoImport({
      dts: false,
      imports: [
        'vue',
        'vue-router',
        { pinia: ['defineStore', 'storeToRefs'] },
        { 'vue-i18n': ['useI18n'] },
        {
          '#app': [
            'navigateTo',
            'useRuntimeConfig',
            'definePageMeta',
            'defineNuxtRouteMiddleware',
            'defineNuxtPlugin',
            'useHead',
            'useNuxtApp',
          ],
        },
      ],
      dirs: [r('../app/stores'), r('../app/utils')],
      vueTemplate: true,
    }),
  ]
}

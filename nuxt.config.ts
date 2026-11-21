// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  // The app talks to Firebase directly from the browser (Auth + Firestore),
  // so it is built as a static SPA and served from Firebase Hosting.

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins?.push(vuetify({ autoImport: true }))
      })
    },
  ], ssr: false,

  devtools: { enabled: false },

  app: {
    head: {
      title: 'Twój mechanik',
      meta: [{ name: 'description', content: 'Napraw swój samochód!' }],
    },
  },

  runtimeConfig: {
    public: {
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
      },
      // Vector base style – OpenFreeMap: free, no API key, commercial use allowed; the map shows the
      // required OpenStreetMap attribution itself. Light/dark colours and Polish labels: utils/mapStyle.ts.
      map: {
        style: 'https://tiles.openfreemap.org/styles/positron',
      },
      // Set NUXT_PUBLIC_USE_EMULATORS=true to talk to `firebase emulators:start`.
      useEmulators: false,
    },
  },

  build: {
    transpile: ['vuetify'],
  },

  compatibilityDate: '2026-11-01',

  // Look for a newer deployed build every 5 minutes (default 1 h) – the page then offers a reload.
  experimental: {
    checkOutdatedBuildInterval: 5 * 60 * 1000,
  },

  vite: {
    vue: {
      template: { transformAssetUrls },
    },
  },

  // Stories and unit tests live outside app/ but import app code – typecheck them with it.
  typescript: {
    tsConfig: {
      include: ['../stories/**/*', '../tests/**/*'],
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'pl',
    locales: [
      { code: 'pl', name: 'Polski', file: 'pl.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'current-language',
      fallbackLocale: 'pl',
    },
    vueI18n: './i18n.config.ts',
  },

  // Signed-in users are remembered between browser sessions.
  piniaPluginPersistedstate: {
    storage: 'localStorage',
  },
})

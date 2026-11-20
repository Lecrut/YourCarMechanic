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
      // Vector map styles (light/dark follow the app theme). OpenFreeMap: free, no API key, commercial
      // use allowed; the map shows the required OpenStreetMap attribution itself.
      map: {
        lightStyle: 'https://tiles.openfreemap.org/styles/positron',
        darkStyle: 'https://tiles.openfreemap.org/styles/dark',
      },
      // Set NUXT_PUBLIC_USE_EMULATORS=true to talk to `firebase emulators:start`.
      useEmulators: false,
    },
  },

  build: {
    transpile: ['vuetify'],
  },

  compatibilityDate: '2026-11-01',

  vite: {
    vue: {
      template: { transformAssetUrls },
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

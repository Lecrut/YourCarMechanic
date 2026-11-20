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
      // Map tiles (light/dark follow the app theme). CARTO basemaps: free for non-commercial use –
      // for a commercial launch switch to a paid provider (e.g. MapTiler) via NUXT_PUBLIC_MAP_*.
      map: {
        lightTiles: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        darkTiles: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
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

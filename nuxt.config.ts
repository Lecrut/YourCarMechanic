// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, {transformAssetUrls} from 'vite-plugin-vuetify'
import wasm from 'vite-plugin-wasm';

export default defineNuxtConfig({
    app: {
        head: {
            title: 'Twój mechanik',
            meta: [
                {name: 'description', content: 'Napraw swój samochód!'},
            ],
        },
    },

    build: {
        transpile: ['vuetify', '@vuepic/vue-datepicker'],
    },

    modules: [
        '@nuxtjs/i18n',
        '@pinia/nuxt',
        'pinia-plugin-persistedstate/nuxt',
        (_options, nuxt) => {
            nuxt.hooks.hook('vite:extendConfig', (config) => {
                // @ts-expect-error
                config.plugins.push(vuetify({autoImport: true}))
            })
        },
    ],
    piniaPluginPersistedstate: {
        storage: 'sessionStorage',
    },
    vite: {
        plugins: [
            wasm()
        ],
        vue: {
            template: {
                transformAssetUrls,
            },
        },
    },

    i18n: {
        strategy: 'no_prefix',
        defaultLocale: 'pl',
        vueI18n: './i18n.config.ts',
    },

    nitro: {
        firebase: {
            nodeVersion: "20",
            gen: 2,
        },
        preset: "firebase"
    },

    runtimeConfig: {
        public: {
            NODE_ENV: process.env.NODE_ENV,
            APP_VERSION: process.env.npm_package_version,
            apiKey: process.env.apiKey,
            authDomain: process.env.authDomain,
            projectId: process.env.projectId,
            storageBucket: process.env.storageBucket,
            messagingSenderId: process.env.messagingSenderId,
            appId: process.env.appId,
            measurementId: process.env.measurementId,
        },
    },

    devtools: {
        enabled: false
    },
    compatibilityDate: '2024-08-18',
    // ssr: false,
})
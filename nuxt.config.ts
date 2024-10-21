// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, {transformAssetUrls} from 'vite-plugin-vuetify'

export default defineNuxtConfig({
    build: {
        transpile: ['vuetify'],
    },

    modules: [
        '@nuxtjs/i18n',
        '@pinia/nuxt',
        (_options, nuxt) => {
            nuxt.hooks.hook('vite:extendConfig', (config) => {
                // @ts-expect-error
                config.plugins.push(vuetify({autoImport: true}))
            })
        },
    ],

    vite: {
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
            nodeVersion: "16",
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

    devtools: {enabled: true},
    compatibilityDate: '2024-08-18',
})
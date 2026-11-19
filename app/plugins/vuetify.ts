import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { vuetifyOptions } from '~/utils/vuetifyOptions'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createVuetify(vuetifyOptions))
})

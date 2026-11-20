import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { vuetifyOptions } from '~/utils/vuetifyOptions'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify(vuetifyOptions)
  nuxtApp.vueApp.use(vuetify)
  // Vuetify's own texts ("Items per page", date pickers…) follow the app language.
  const i18n = nuxtApp.$i18n as { locale: Ref<string> }
  watch(i18n.locale, (locale) => {
    vuetify.locale.current.value = locale
  }, { immediate: true })
})

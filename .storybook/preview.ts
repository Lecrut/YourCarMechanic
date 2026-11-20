import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { type Decorator, type Preview, setup } from '@storybook/vue3-vite'
import { createVuetify } from 'vuetify'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterLink } from 'vue-router'
import { h } from 'vue'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { vuetifyOptions } from '~/utils/vuetifyOptions'
import { i18n } from './mocks/i18n'
import MySnackbar from '~/components/common/mySnackbar.vue'
import ErrorSnackbar from '~/components/layout/errorSnackbar.vue'
import { resetDb } from './mocks/services'
import { navigatedTo } from './mocks/nuxt'
import { useAuthStore } from '~/stores/authStore'
import type { IUser } from '~/types/user'
import type { IWorkshop } from '~/types/workshop'
// Overlays without transitions: play tests can click into dialogs/menus immediately.
const noTransition = { transition: false }
const vuetify = createVuetify({
  ...vuetifyOptions,
  components,
  directives,
  defaults: {
    ...vuetifyOptions.defaults,
    VDialog: noTransition,
    VMenu: noTransition,
    VTooltip: noTransition,
    VSnackbar: noTransition,
  },
})
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
})

// Storybook creates a new Vue app per story – a new Pinia here means fresh stores every time.
setup((app) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  app.use(pinia)
  app.use(vuetify)
  app.use(i18n)
  app.use(router)
  // Nuxt globals used in templates.
  app.component('NuxtLink', RouterLink)
  app.component('MySnackbar', MySnackbar)
})

/** Story parameters understood by the decorator below (`parameters.app`). */
export interface AppParameters {
  /** Signed-in user put into the auth store (null = guest). */
  user?: IUser | null
  company?: IWorkshop | null
}

const withApp: Decorator = (story, context) => {
  const { locale, theme } = context.globals as { locale: 'pl' | 'en', theme: 'light' | 'dark' }
  const params = (context.parameters.app ?? {}) as AppParameters
  const Story = story()

  return {
    setup() {
      i18n.global.locale.value = locale
      vuetify.locale.current.value = locale
      vuetify.theme.change(theme)
      resetDb()
      navigatedTo.length = 0

      const auth = useAuthStore()
      auth.user = params.user ?? null
      auth.company = params.company ?? null
    },
    render: () => h(components.VApp, null, {
      default: () => h(components.VMain, { class: 'pa-4' }, { default: () => [h(Story), h(ErrorSnackbar)] }),
    }),
  }
}

const preview: Preview = {
  decorators: [withApp],
  globalTypes: {
    locale: {
      description: 'Język',
      toolbar: { icon: 'globe', items: [{ value: 'pl', title: 'Polski' }, { value: 'en', title: 'English' }], dynamicTitle: true },
    },
    theme: {
      description: 'Motyw',
      toolbar: { icon: 'mirror', items: [{ value: 'dark', title: 'Dark' }, { value: 'light', title: 'Light' }], dynamicTitle: true },
    },
  },
  initialGlobals: { locale: 'pl', theme: 'dark' },
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  tags: ['autodocs'],
}

export default preview

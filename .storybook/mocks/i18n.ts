import { createI18n } from 'vue-i18n'
import pl from '../../i18n/locales/pl.json'
import en from '../../i18n/locales/en.json'

/** The one i18n instance of Storybook/Vitest – used by the preview and by the `useNuxtApp().$i18n` mock. */
export const i18n = createI18n({ legacy: false, locale: 'pl', fallbackLocale: 'en', messages: { pl, en } })

import type { VuetifyOptions } from 'vuetify'
import { en, pl } from 'vuetify/locale'

/** Shared by the Nuxt plugin and Storybook so stories look exactly like the app. */
export const vuetifyOptions: VuetifyOptions = {
  // Vuetify 4 lowered the breakpoints – keep the v3 ones the layout was designed for.
  display: {
    thresholds: { md: 960, lg: 1280, xl: 1920, xxl: 2560 },
  },
  // Built-in component texts (tables, pagination, pickers) – kept in sync with the i18n locale.
  locale: { locale: 'pl', fallback: 'en', messages: { pl, en } },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#0054db',
          secondary: '#2196f3',
          error: '#d50010',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#4d8dff',
          secondary: '#2196f3',
          error: '#ff5252',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      color: 'primary',
      variant: 'flat',
      rounded: 'pill',
    },
    VCard: {
      rounded: 'xl',
    },
    VSheet: {
      rounded: 'xl',
    },
    VAlert: {
      rounded: 'xl',
    },
    VTextField: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VSelect: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VCombobox: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VTextarea: { variant: 'outlined', rounded: 'lg' },
    VChip: { rounded: 'lg' },
    // Titles wrap instead of being cut with "…" on narrow screens.
    VCardTitle: { class: 'text-wrap' },
    VCardSubtitle: { class: 'text-wrap' },
    // VListItemTitle: { class: 'text-wrap' },
    // VToolbarTitle: { class: 'text-wrap' },
    // Below a card title the content has no top padding; in a (scrollable) dialog that clips the
    // floating label of the first outlined field.
    VDialog: { VCardText: { class: 'pt-4' } },
    // Below `md` tables turn into stacked cards (label: value per row) instead of scrolling sideways.
    VDataTable: { mobileBreakpoint: 'md' },
  },
}

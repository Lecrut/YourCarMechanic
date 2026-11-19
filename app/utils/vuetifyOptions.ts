import type { VuetifyOptions } from 'vuetify'

/** Shared by the Nuxt plugin and Storybook so stories look exactly like the app. */
export const vuetifyOptions: VuetifyOptions = {
  // Vuetify 4 lowered the breakpoints – keep the v3 ones the layout was designed for.
  display: {
    thresholds: { md: 960, lg: 1280, xl: 1920, xxl: 2560 },
  },
  theme: {
    defaultTheme: 'dark',
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
      rounded: 'lg',
    },
    VCard: {
      rounded: 'xl',
    },
    VSheet: {
      rounded: 'xl',
    },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VCombobox: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined' },
    VChip: { rounded: 'lg' },
  },
}

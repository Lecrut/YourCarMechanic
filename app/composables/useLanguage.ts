import flagPl from '~/assets/flags/pl.svg'
import flagGb from '~/assets/flags/gb.svg'

export const LANGUAGES = [
  { code: 'pl', name: 'Polski', flag: flagPl },
  { code: 'en', name: 'English', flag: flagGb },
] as const

export type LanguageCode = typeof LANGUAGES[number]['code']

/** Current language + switching. Nuxt i18n switches and remembers it; plain vue-i18n (Storybook) just sets it. */
export function useLanguage() {
  const i18n = useI18n()
  const current = computed(() => LANGUAGES.find(l => l.code === i18n.locale.value) ?? LANGUAGES[0])

  async function setLanguage(code: LanguageCode) {
    const set = (i18n as { setLocale?: (c: string) => Promise<void> }).setLocale
    if (typeof set === 'function') await set(code)
    else i18n.locale.value = code
  }

  return { languages: LANGUAGES, current, setLanguage }
}

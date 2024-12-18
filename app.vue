<script setup lang="ts">
import {useTheme} from "vuetify";
import {useLocalStorage} from "@vueuse/core";

const {locale, setLocale} = useI18n()

const theme = useTheme()
const route = useRoute()

const currentThemeStore = useLocalStorage('current-theme', 'dark')
const currentLangStore = useLocalStorage('current-language', 'pl')

onMounted(() => {
  if (currentLangStore.value) {
    setLocale(currentLangStore.value)
    locale.value = currentLangStore.value
  } else {
    setLocale((navigator.languages.includes('pl') || navigator.languages.includes('pl-PL'))
        ? locale.value = 'pl'
        : locale.value = 'en')
  }

  if (currentThemeStore.value)
    theme.global.name.value = currentThemeStore.value
})

watch(route, () => {
  if (currentLangStore.value) {
    setLocale(currentLangStore.value)
  } else {
    setLocale((navigator.languages.includes('pl') || navigator.languages.includes('pl-PL'))
        ? locale.value = 'pl'
        : locale.value = 'en')
  }
}, {immediate: true})

watch(currentLangStore, (newLang) => {
  setLocale(newLang)
  locale.value = newLang
})

watch(currentThemeStore, (newTheme) => {
  theme.global.name.value = newTheme
})
</script>

<template>
  <NuxtLayout>
    <v-app>
      <v-main>
        <NuxtPage/>
      </v-main>
    </v-app>
  </NuxtLayout>
</template>

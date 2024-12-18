<script setup lang="ts">
import {useTheme} from "vuetify";
import {useLocalStorage} from "@vueuse/core";

const {locale, setLocale} = useI18n()

const theme = useTheme()

const currentThemeStore = useLocalStorage('current-theme', 'dark')
const currentLangStore = useLocalStorage('current-language', 'pl')

onMounted(() => {
  if (currentLangStore.value) {
    setLocale(currentLangStore.value)
  }

  if (currentThemeStore.value)
    theme.global.name.value = currentThemeStore.value
})

watch(currentLangStore, (newLang) => {
  setLocale(newLang)
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

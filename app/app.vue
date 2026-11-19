<script setup lang="ts">
import { useTheme } from 'vuetify'

const theme = useTheme()
const servicesStore = useServicesStore()
const { t, locale } = useI18n()

useHead({
  htmlAttrs: { lang: locale },
  titleTemplate: title => (title ? `${title} · ${t('navBar.title')}` : t('navBar.title')),
})

onMounted(() => {
  try {
    const savedTheme = localStorage.getItem('current-theme')
    if (savedTheme) theme.change(savedTheme)
  }
  catch {
    // storage unavailable (private mode) – keep the default theme
  }

  servicesStore.load()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

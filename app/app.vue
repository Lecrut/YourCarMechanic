<script setup lang="ts">
import { useTheme } from 'vuetify'

const theme = useTheme()
const servicesStore = useServicesStore()

onMounted(() => {
  const savedTheme = localStorage.getItem('current-theme')
  if (savedTheme) theme.change(savedTheme)

  servicesStore.load()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import AppNavigation from '~/components/appNavigation.vue'
import ErrorSnackbar from '~/components/errorSnackbar.vue'
</script>

<template>
  <v-app>
    <app-navigation />
    <v-main>
      <slot />
    </v-main>
    <error-snackbar />
  </v-app>
</template>

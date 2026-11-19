<script setup lang="ts">
import AppNavigation from '~/components/appNavigation.vue'
import ErrorSnackbar from '~/components/errorSnackbar.vue'
import EmailVerificationBanner from '~/components/emailVerificationBanner.vue'
</script>

<template>
  <v-app>
    <app-navigation />
    <v-main>
      <email-verification-banner />
      <slot />
    </v-main>
    <error-snackbar />
  </v-app>
</template>

<script setup lang="ts">
import AppNavigation from '~/components/appNavigation.vue'
import AppFooter from '~/components/appFooter.vue'
import ErrorSnackbar from '~/components/errorSnackbar.vue'
import EmailVerificationBanner from '~/components/emailVerificationBanner.vue'

const authStore = useAuthStore()
/** Every page a guest sees has the footer, always at the bottom of the screen even when the page is short. */
const showFooter = computed(() => !authStore.user)
</script>

<template>
  <v-app>
    <app-navigation />
    <v-main class="d-flex flex-column">
      <email-verification-banner />
      <div class="flex-grow-1">
        <slot />
      </div>
      <app-footer v-if="showFooter" />
    </v-main>
    <error-snackbar />
  </v-app>
</template>

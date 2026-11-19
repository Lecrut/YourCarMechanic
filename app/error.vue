<script setup lang="ts">
import type { NuxtError } from '#app'
import AppNavigation from '~/components/appNavigation.vue'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const authStore = useAuthStore()

const notFound = computed(() => props.error.statusCode === 404)

useHead({ title: () => (notFound.value ? t('errorPage.notFoundTitle') : t('errorPage.title')) })

/** Leaves the error state and goes to the right home page for the current user. */
const goHome = () => clearError({ redirect: authStore.user ? authStore.homePath : '/' })
</script>

<template>
  <v-app>
    <app-navigation />
    <v-main>
      <v-container class="fill-height d-flex align-center justify-center">
        <v-empty-state
          :icon="notFound ? 'mdi-map-marker-question-outline' : 'mdi-car-wrench'"
          :headline="String(error.statusCode || 500)"
          :title="notFound ? t('errorPage.notFoundTitle') : t('errorPage.title')"
          :text="notFound ? t('errorPage.notFoundText') : t('errorPage.text')"
        >
          <template #actions>
            <v-btn
              prepend-icon="mdi-home"
              size="large"
              data-testid="error-home"
              @click="goHome"
            >
              {{ t('errorPage.home') }}
            </v-btn>
          </template>
        </v-empty-state>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppFooter from '~/components/appFooter.vue'

definePageMeta({ middleware: ['guest'] })

const { t } = useI18n()

const steps = computed(() => [
  { icon: 'mdi-calendar-check', key: 'first' },
  { icon: 'mdi-car-wrench', key: 'second' },
  { icon: 'mdi-car-key', key: 'third' },
].map(s => ({
  icon: s.icon,
  title: t(`landing.second.timeline.${s.key}.title`),
  text: t(`landing.second.timeline.${s.key}.subtitle`),
})))
</script>

<template>
  <div>
    <v-img
      src="/landingOne.webp"
      cover
      gradient="to bottom, rgba(0,0,0,.3), rgba(0,0,0,.75)"
      height="90vh"
    >
      <v-container class="fill-height d-flex align-center justify-center text-center">
        <div>
          <h1 class="text-display-medium font-weight-bold text-white mb-4">
            {{ t('landing.first.title') }}
          </h1>
          <p class="text-body-large text-white mb-8">
            {{ t('landing.first.text') }}
          </p>
          <v-btn
            to="/auth/register"
            size="x-large"
            append-icon="mdi-arrow-right"
            elevation="4"
          >
            {{ t('landing.first.button') }}
          </v-btn>
        </div>
      </v-container>
    </v-img>

    <v-container class="py-16">
      <h2 class="text-headline-large font-weight-bold text-center mb-10">
        {{ t('landing.second.title') }}
      </h2>

      <v-row class="justify-center">
        <v-col
          v-for="(step, index) in steps"
          :key="step.title"
          cols="12"
          md="4"
        >
          <v-card
            hover
            variant="tonal"
            class="h-100 pa-4 text-center"
          >
            <v-avatar
              color="primary"
              size="64"
              class="mb-4"
            >
              <v-icon
                :icon="step.icon"
                size="32"
              />
            </v-avatar>
            <v-card-title class="text-title-large">
              {{ index + 1 }}. {{ step.title }}
            </v-card-title>
            <v-card-text class="text-body-large">
              {{ step.text }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-img
      src="/landingTwo.webp"
      cover
      gradient="to bottom, rgba(0,0,0,.3), rgba(0,0,0,.75)"
      height="60vh"
    >
      <v-container class="fill-height d-flex align-center justify-center text-center">
        <div>
          <h2 class="text-headline-large font-weight-bold text-white mb-3">
            {{ t('landing.third.title') }}
          </h2>
          <p class="text-body-large text-white mb-6">
            {{ t('landing.third.text') }}
          </p>
          <v-btn
            to="/about"
            size="large"
            variant="outlined"
            color="white"
          >
            {{ t('landing.third.button') }}
          </v-btn>
        </div>
      </v-container>
    </v-img>

    <app-footer />
  </div>
</template>

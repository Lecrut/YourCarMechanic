<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <v-img
      src="/aboutOne.webp"
      cover
      gradient="to bottom, rgba(0,0,0,.3), rgba(0,0,0,.75)"
      height="70vh"
    >
      <v-container class="fill-height d-flex align-center justify-center text-center">
        <div>
          <h1 class="text-display-medium font-weight-bold text-white mb-4">
            {{ t('about.first.title') }}
          </h1>
          <p class="text-body-large text-white">
            {{ t('about.first.text') }}
          </p>
        </div>
      </v-container>
    </v-img>

    <v-container class="py-16">
      <v-row class="align-center">
        <v-col
          cols="12"
          md="6"
        >
          <h2 class="text-headline-large font-weight-bold mb-4">
            {{ t('about.second.title') }}
          </h2>
          <p class="text-body-large">
            {{ t('about.second.text') }}
          </p>
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-card hover>
            <v-img
              src="/aboutTwo.webp"
              aspect-ratio="4/3"
              cover
            />
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-img
      src="/aboutThree.webp"
      cover
      gradient="to bottom, rgba(0,0,0,.3), rgba(0,0,0,.75)"
      height="60vh"
    >
      <v-container class="fill-height d-flex align-center justify-center text-center">
        <div>
          <h2 class="text-headline-large font-weight-bold text-white mb-3">
            {{ t('about.third.title') }}
          </h2>
          <p class="text-body-large text-white">
            {{ t('about.third.text') }}
          </p>
        </div>
      </v-container>
    </v-img>

    <v-container class="py-16">
      <v-sheet
        color="primary"
        class="pa-10 text-center mx-auto"
        max-width="800"
        elevation="3"
      >
        <h2 class="text-headline-large font-weight-bold mb-3">
          {{ t('about.fourth.title') }}
        </h2>
        <p class="text-body-large mb-6">
          {{ t('about.fourth.text') }}
        </p>
        <v-btn
          to="/auth/register"
          size="large"
          color="surface"
          append-icon="mdi-arrow-right"
        >
          {{ t('about.fourth.button') }}
        </v-btn>
      </v-sheet>
    </v-container>
  </div>
</template>

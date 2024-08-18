<script setup lang="ts">
  const { t } = useI18n()
</script>

<template>
  <v-img
      src="/aboutOne.jpg"
      cover
      gradient="to bottom, rgba(0,0,0,.25), rgba(0,0,0,.7)"
      class="mt-15 text-center"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-4 d-md">
      <span class="text-h3 font-weight-bold text-white hidden-sm-and-down">
        {{ t('about.first.title') }}
      </span>

      <span class="text-h5 font-weight-bold text-white hidden-md-and-up">
        {{ t('about.first.title') }}
      </span>

      <p class="mt-2 text-white">
        {{ t('about.first.text') }}
      </p>

    </div>
  </v-img>

  <v-card
      class="mx-10 my-5 mb-10 px-4"
      elevation="0"
      rounded="xl"
      color="transparent"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-2 mt-10 text-center">
      <span class="text-h4 font-weight-bold mb-4 hidden-sm-and-down">
        {{ t('about.second.title') }}
      </span>

      <span class="text-h6 font-weight-bold mb-4 hidden-md-and-up">
        {{ t('about.second.title') }}
      </span>

      <p class="mt-2">
        {{ t('about.second.text') }}
      </p>

      <v-img
          class="mx-auto my-5 elevation-5"
          rounded="xl"
          :width="300"
          aspect-ratio="4/3"
          cover
          src="/aboutTwo.jpg"
      />
    </div>
  </v-card>

  <v-img
      src="/aboutThree.jpg"
      cover
      gradient="to bottom, rgba(0,0,0,.25), rgba(0,0,0,.7)"
      class="text-center"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-2">
      <span class="text-h4 font-weight-bold text-white hidden-sm-and-down">
        {{ t('about.third.title') }}
      </span>

      <span class="text-h6 font-weight-bold text-white hidden-md-and-up">
        {{ t('about.third.title') }}
      </span>

      <p class="mt-2 text-white">
        {{ t('about.third.text') }}
      </p>

    </div>
  </v-img>


  <v-card
      class="mx-10 mt-5 mb-15 px-4"
      elevation="0"
      rounded="xl"
      color="transparent"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-2 my-10 text-center">
      <span class="text-h4 font-weight-bold mb-4 hidden-sm-and-down">
        {{ t('about.fourth.title') }}
      </span>

      <span class="text-h6 font-weight-bold mb-4 hidden-md-and-up">
        {{ t('about.fourth.title') }}
      </span>

      <p class="mt-2">
        {{ t('about.fourth.text') }}
      </p>

      <v-btn class="my-6" to="/auth/register" variant="elevated" color="primary">
        {{ t('about.fourth.button') }}
      </v-btn>
    </div>
  </v-card>

  <div class="my-15 hidden-md-and-up" />
</template>
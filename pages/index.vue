<script setup lang="ts">
  const { t } = useI18n()
</script>

<template>
  <v-img
      src="/landingOne.jpg"
      cover
      gradient="to bottom, rgba(0,0,0,.25), rgba(0,0,0,.7)"
      class="mt-15 text-center"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-4 d-md">
      <span class="text-h3 font-weight-bold text-white hidden-sm-and-down">
        {{ t('landing.first.title') }}
      </span>

      <span class="text-h5 font-weight-bold text-white hidden-md-and-up">
        {{ t('landing.first.title') }}
      </span>

      <p class="mt-2 text-white">
        {{ t('landing.first.text') }}
      </p>

      <v-btn class="my-4" to="auth/login" variant="elevated" color="primary">
        {{ t('landing.first.button') }}
      </v-btn>

    </div>
  </v-img>

  <v-card
      class="mx-10 my-5 px-4"
      elevation="0"
      min-height="400"
      rounded="xl"
      color="transparent"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-2 mt-15 text-center">
      <span class="text-h4 font-weight-bold mb-4 hidden-sm-and-down">
        {{ t('landing.second.title') }}
      </span>

      <span class="text-h6 font-weight-bold mb-4 hidden-md-and-up">
        {{ t('landing.second.title') }}
      </span>

      <v-timeline
          align="start"
          class="hidden-sm-and-down"
      >
        <v-timeline-item
            dot-color="secondary"
        >
          <div>
            <div class="text-h6">{{ t('landing.second.timeline.first.title') }}</div>
            <p>
              {{ t('landing.second.timeline.first.subtitle') }}
            </p>
          </div>
        </v-timeline-item>

        <v-timeline-item
            dot-color="primary"
        >
          <div>
            <div class="text-h6">{{ t('landing.second.timeline.second.title') }}</div>
            <p>
              {{ t('landing.second.timeline.second.subtitle') }}
            </p>
          </div>
        </v-timeline-item>

        <v-timeline-item
            dot-color="secondary"
        >
          <div>
            <div class="text-h6">{{ t('landing.second.timeline.third.title') }}</div>
            <p>
              {{ t('landing.second.timeline.third.subtitle') }}
            </p>
          </div>
        </v-timeline-item>
      </v-timeline>

      <v-timeline
          align="start"
          side="end"
          class="hidden-md-and-up"
      >
        <v-timeline-item
            dot-color="secondary"
        >
          <div>
            <div class="text-h6">{{ t('landing.second.timeline.first.title') }}</div>
            <p>
              {{ t('landing.second.timeline.first.subtitle') }}
            </p>
          </div>
        </v-timeline-item>

        <v-timeline-item
            dot-color="primary"
        >
          <div>
            <div class="text-h6">{{ t('landing.second.timeline.second.title') }}</div>
            <p>
              {{ t('landing.second.timeline.second.subtitle') }}
            </p>
          </div>
        </v-timeline-item>

        <v-timeline-item
            dot-color="secondary"
        >
          <div>
            <div class="text-h6">{{ t('landing.second.timeline.third.title') }}</div>
            <p>
              {{ t('landing.second.timeline.third.subtitle') }}
            </p>
          </div>
        </v-timeline-item>
      </v-timeline>


    </div>
  </v-card>

  <v-img
      src="/landingTwo.jpg"
      cover
      gradient="to bottom, rgba(0,0,0,.25), rgba(0,0,0,.7)"
      class="text-center"
  >
    <div class="d-flex flex-column align-center justify-center h-100 mx-2">
      <span class="text-h4 font-weight-bold text-white hidden-sm-and-down">
        {{ t('landing.third.title') }}
      </span>

      <span class="text-h6 font-weight-bold text-white hidden-md-and-up">
        {{ t('landing.third.title') }}
      </span>

      <p class="mt-2 text-white">
        {{ t('landing.third.text') }}
      </p>

      <v-btn class="mt-4" to="/about" variant="elevated" color="primary">
        {{ t('landing.third.button') }}
      </v-btn>

    </div>
  </v-img>
</template>

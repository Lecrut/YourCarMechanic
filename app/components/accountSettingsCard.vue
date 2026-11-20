<script setup lang="ts">
import { useLanguage } from '~/composables/useLanguage'

/** Account preferences on every role's profile page – a single compact row with the app language. */
const { t } = useI18n()
const { languages, current, setLanguage } = useLanguage()
</script>

<template>
  <v-card
    elevation="2"
    data-testid="account-settings"
  >
    <v-list-item
      class="py-3 px-6"
      prepend-icon="mdi-translate"
      :title="t('navBar.language')"
      :subtitle="current.name"
    >
      <template #append>
        <v-btn-toggle
          :model-value="current.code"
          mandatory
          rounded="pill"
          density="comfortable"
          variant="outlined"
          color="primary"
          divided
          data-testid="profile-language"
        >
          <v-btn
            v-for="l in languages"
            :key="l.code"
            :value="l.code"
            :aria-label="l.name"
            :data-testid="`profile-language-${l.code}`"
            @click="setLanguage(l.code)"
          >
            <v-avatar
              :image="l.flag"
              size="20"
              class="elevation-1"
            />
            <span class="ms-2 text-label-large font-weight-bold">{{ l.code.toUpperCase() }}</span>
          </v-btn>
        </v-btn-toggle>
      </template>
    </v-list-item>
  </v-card>
</template>

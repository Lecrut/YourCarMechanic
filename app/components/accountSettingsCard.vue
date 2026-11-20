<script setup lang="ts">
/** Shared language preference card shown on every role's profile page. */
const { t, locale, locales, setLocale } = useI18n()
</script>

<template>
  <v-card
    class="pa-6"
    elevation="2"
  >
    <div class="text-title-large font-weight-bold mb-4">
      {{ t('navBar.language') }}
    </div>

    <v-select
      :model-value="locale"
      :items="locales"
      item-title="name"
      item-value="code"
      :label="t('navBar.language')"
      prepend-inner-icon="mdi-translate"
      hide-details
      data-testid="profile-language"
      @update:model-value="(code) => setLocale(code as typeof locale)"
    />
  </v-card>
</template>

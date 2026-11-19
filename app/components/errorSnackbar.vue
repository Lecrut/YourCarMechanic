<script setup lang="ts">
/** The app's only error snackbar – shows the message of the last failed action (sharedStore). */
const { t } = useI18n()
const sharedStore = useSharedStore()
const { error, errorMessage } = storeToRefs(sharedStore)
</script>

<template>
  <v-snackbar
    v-model="error"
    color="error"
    timeout="4000"
    rounded="pill"
    location="bottom"
    data-testid="error-snackbar"
  >
    <v-icon
      icon="mdi-alert-circle"
      class="mr-2"
    />
    {{ t(errorMessage) }}
    <template #actions>
      <v-btn
        v-tooltip="t('universal.close')"
        icon="mdi-close"
        variant="text"
        color="white"
        size="small"
        :aria-label="t('universal.close')"
        @click="error = false"
      />
    </template>
  </v-snackbar>
</template>

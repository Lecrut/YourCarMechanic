<script setup lang="ts">
/** Shown at the bottom of every page when a newer version was deployed – browsers keep running the old one. */
const { t } = useI18n()
const { updateAvailable } = storeToRefs(useSharedStore())

function reload() {
  window.location.reload()
}
</script>

<template>
  <v-snackbar
    :model-value="updateAvailable"
    :timeout="-1"
    location="bottom"
    vertical
    data-testid="update-banner"
  >
    <div class="d-flex align-center ga-2">
      <v-icon icon="mdi-update" />
      {{ t('update.available') }}
    </div>
    <template #actions>
      <v-btn
        prepend-icon="mdi-refresh"
        data-testid="update-reload"
        @click="reload"
      >
        {{ t('update.reload') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

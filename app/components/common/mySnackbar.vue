<script setup lang="ts">
const isVisible = defineModel<boolean>({ default: false })

defineProps<{
  isError: boolean
  text: string
}>()
</script>

<template>
  <v-snackbar
    v-model="isVisible"
    :color="isError ? 'error' : 'primary'"
    timeout="1400"
    rounded="pill"
  >
    <v-icon
      :icon="isError ? 'mdi-alert-circle' : 'mdi-information'"
      class="mx-3"
    />
    {{ text }}
  </v-snackbar>
</template>

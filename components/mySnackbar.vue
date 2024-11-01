<script setup lang="ts">
const isVisible = defineModel<boolean>()

const props = defineProps<{
  isError: boolean,
  text: string
}>()

const {isError, text} = toRefs(props)
</script>

<template>
  <v-snackbar
      :model-value="isVisible"
      :color="isError ? 'error' : 'primary'"
      timeout="1400"
      rounded="pill"
  >
    <v-icon
        :icon="isError ? 'mdi-alert-circle' : 'mdi-information'"
        claas="mx-3"
    />
    {{ text }}
  </v-snackbar>
</template>

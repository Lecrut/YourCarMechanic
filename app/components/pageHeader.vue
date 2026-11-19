<script setup lang="ts">
defineProps<{
  title: string
  icon: string
  subtitle?: string
}>()
</script>

<template>
  <div class="d-flex align-center flex-wrap ga-4 mb-6">
    <v-avatar
      color="primary"
      variant="tonal"
      size="56"
    >
      <v-icon
        :icon="icon"
        size="28"
      />
    </v-avatar>
    <div>
      <h1 class="text-headline-medium font-weight-bold">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="text-body-medium text-medium-emphasis"
      >
        {{ subtitle }}
      </p>
    </div>
    <v-spacer />
    <slot />
  </div>
</template>

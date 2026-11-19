<script setup lang="ts">
import AppNavigation from '~/components/appNavigation.vue'
</script>

<template>
  <v-app>
    <app-navigation />
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

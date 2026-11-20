<script setup lang="ts">
import { useDisplay } from 'vuetify'

/** Services of a row in a table: chips on larger screens, wrapping text on phones (chips never wrap and widen the table). */
defineProps<{ services: string[] }>()

const servicesStore = useServicesStore()
const { mdAndUp } = useDisplay()
</script>

<template>
  <div v-if="mdAndUp">
    <v-chip
      v-for="key in services"
      :key="key"
      size="small"
      variant="tonal"
      class="ma-1"
    >
      {{ servicesStore.label(key) }}
    </v-chip>
  </div>
  <span
    v-else
    class="text-body-small"
  >{{ services.map(servicesStore.label).join(', ') }}</span>
</template>

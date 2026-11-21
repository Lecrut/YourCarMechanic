<script setup lang="ts">
import { useDisplay } from 'vuetify'

/**
 * Services of a row in a table: the first `max` as chips on larger screens (wrapping text on phones –
 * chips never wrap and widen the table), the rest collapsed into "+N" with the names in a tooltip.
 */
const props = withDefaults(defineProps<{ services: string[], max?: number }>(), { max: 3 })

const servicesStore = useServicesStore()
const { mdAndUp } = useDisplay()

const shown = computed(() => props.services.slice(0, props.max))
const hidden = computed(() => props.services.slice(props.max).map(servicesStore.label))
</script>

<template>
  <div v-if="mdAndUp">
    <v-chip
      v-for="key in shown"
      :key="key"
      size="small"
      variant="tonal"
      class="ma-1 h-auto py-1 text-wrap"
    >
      {{ servicesStore.label(key) }}
    </v-chip>
    <v-chip
      v-if="hidden.length"
      v-tooltip:top="hidden.join(', ')"
      size="small"
      variant="outlined"
      class="ma-1 h-auto py-1 text-wrap"
      data-testid="services-more"
    >
      +{{ hidden.length }}
    </v-chip>
  </div>
  <span
    v-else
    class="text-body-small"
  >{{ shown.map(servicesStore.label).join(', ') }}<span
    v-if="hidden.length"
    v-tooltip:top="hidden.join(', ')"
    class="font-weight-bold"
    data-testid="services-more"
  > +{{ hidden.length }}</span></span>
</template>

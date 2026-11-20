<script setup lang="ts">
import { useDisplay } from 'vuetify'
import PageHeader from '~/components/pageHeader.vue'
import { useModeratorLive } from '~/composables/useModeratorLive'

/**
 * Frame of every moderator page: header on larger screens, the content in a card.
 * Small screens drop the big header and use tight paddings so as much as possible fits.
 */
defineProps<{
  title: string
  subtitle?: string
  icon: string
}>()

const { smAndDown } = useDisplay()
useModeratorLive()
</script>

<template>
  <v-container
    fluid
    :class="smAndDown ? 'pa-2' : 'py-8'"
  >
    <page-header
      v-if="!smAndDown"
      :title="title"
      :subtitle="subtitle"
      :icon="icon"
    >
      <slot name="actions" />
    </page-header>

    <slot name="top" />

    <v-card
      :elevation="smAndDown ? 0 : 2"
      :class="smAndDown ? 'pa-2' : 'pa-6'"
      :rounded="smAndDown ? 'lg' : 'xl'"
    >
      <slot />
    </v-card>
  </v-container>
</template>

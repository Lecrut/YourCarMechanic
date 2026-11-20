<script setup lang="ts">
import { useDisplay } from 'vuetify'
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import StatsPanel from '~/components/moderator/statsPanel.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
const { smAndDown } = useDisplay()

const moderatorStore = useModeratorStore()
const { users, workshops, fixes, pendingWorkshops } = storeToRefs(moderatorStore)
const reviewsStore = useReviewsStore()

/** Summary tiles – each opens its page. Hidden on small screens (the bottom bar covers it). */
const tiles = computed(() => [
  { to: '/moderator/companies', icon: 'mdi-lock-clock', color: 'warning', value: pendingWorkshops.value.length, label: t('moderator.stats.pending'), hint: t('moderator.stats.pendingHint'), id: 'pending' },
  { to: '/moderator/companies', icon: 'mdi-garage', color: 'primary', value: workshops.value.filter(w => !w.deletedAt).length, label: t('moderator.tabs.companies'), hint: t('moderator.stats.companiesHint'), id: 'companies' },
  { to: '/moderator/clients', icon: 'mdi-account-group', color: 'success', value: users.value.filter(u => u.role !== 'workshop' && u.role !== 'moderator').length, label: t('moderator.tabs.users'), hint: t('moderator.stats.usersHint'), id: 'users' },
  { to: '/moderator/repairs', icon: 'mdi-car-wrench', color: 'info', value: fixes.value.filter(f => !f.isClosed).length, label: t('moderator.activeFixes'), hint: t('moderator.stats.fixesHint'), id: 'fixes' },
  { to: '/moderator/reviews', icon: 'mdi-star', color: 'amber', value: reviewsStore.all.filter(r => !r.deletedAt && !r.hidden).length, label: t('moderator.tabs.reviews'), hint: t('moderator.stats.reviewsHint'), id: 'reviews' },
])
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.stats')"
    :subtitle="t('moderator.pages.stats')"
    icon="mdi-chart-box-outline"
  >
    <template
      v-if="!smAndDown"
      #top
    >
      <v-row class="mb-6">
        <v-col
          v-for="tile in tiles"
          :key="tile.id"
          cols="6"
          md
        >
          <v-card
            v-tooltip:bottom="tile.hint"
            :to="tile.to"
            hover
            variant="tonal"
            :color="tile.color"
            :data-testid="`stat-${tile.id}`"
          >
            <v-card-item>
              <template #prepend>
                <v-icon
                  :icon="tile.icon"
                  size="36"
                />
              </template>
              <v-card-title class="text-headline-medium font-weight-bold">
                {{ tile.value }}
              </v-card-title>
              <v-card-subtitle>{{ tile.label }}</v-card-subtitle>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <stats-panel />
  </moderator-page>
</template>

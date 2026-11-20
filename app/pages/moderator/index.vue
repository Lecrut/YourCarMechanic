<script setup lang="ts">
import PageHeader from '~/components/pageHeader.vue'
import CompaniesTable from '~/components/moderator/companiesTable.vue'
import ServicesTable from '~/components/moderator/servicesTable.vue'
import UsersTable from '~/components/moderator/usersTable.vue'
import FixesTable from '~/components/moderator/fixesTable.vue'
import ReviewsTable from '~/components/moderator/reviewsTable.vue'
import MessagesTable from '~/components/moderator/messagesTable.vue'
import StatsPanel from '~/components/moderator/statsPanel.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

type Tab = 'stats' | 'companies' | 'services' | 'users' | 'fixes' | 'reviews' | 'messages'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const moderatorStore = useModeratorStore()
const { users, workshops, fixes, pendingWorkshops } = storeToRefs(moderatorStore)
const servicesStore = useServicesStore()
const reviewsStore = useReviewsStore()

const tabs: Tab[] = ['stats', 'companies', 'services', 'users', 'fixes', 'reviews', 'messages']
const contactStore = useContactStore()
/** Tab lives in the URL (?tab=) so it survives reloads and can be linked from the navigation. */
const tab = computed<Tab>({
  get: () => (tabs.includes(route.query.tab as Tab) ? route.query.tab as Tab : 'stats'),
  set: value => router.replace({ query: { ...route.query, tab: value } }),
})

const tabMeta = computed(() => [
  { value: 'stats', icon: 'mdi-chart-box-outline', label: t('moderator.tabs.stats'), badge: 0 },
  { value: 'companies', icon: 'mdi-garage', label: t('moderator.tabs.companies'), badge: pendingWorkshops.value.length },
  { value: 'services', icon: 'mdi-tools', label: t('moderator.tabs.services'), badge: 0 },
  { value: 'users', icon: 'mdi-account-group', label: t('moderator.tabs.users'), badge: 0 },
  { value: 'fixes', icon: 'mdi-car-wrench', label: t('moderator.tabs.fixes'), badge: 0 },
  { value: 'reviews', icon: 'mdi-star-outline', label: t('moderator.tabs.reviews'), badge: 0 },
  { value: 'messages', icon: 'mdi-email-outline', label: t('moderator.tabs.messages'), badge: contactStore.newCount },
] as const)

const stats = computed(() => [
  { tab: 'companies', icon: 'mdi-lock-clock', color: 'warning', value: pendingWorkshops.value.length, label: t('moderator.stats.pending'), hint: t('moderator.stats.pendingHint') },
  { tab: 'companies', icon: 'mdi-garage', color: 'primary', value: workshops.value.filter(w => !w.deletedAt).length, label: t('moderator.tabs.companies'), hint: t('moderator.stats.companiesHint') },
  { tab: 'users', icon: 'mdi-account-group', color: 'success', value: users.value.filter(u => u.role !== 'workshop' && u.role !== 'moderator').length, label: t('moderator.tabs.users'), hint: t('moderator.stats.usersHint') },
  { tab: 'fixes', icon: 'mdi-car-wrench', color: 'info', value: fixes.value.filter(f => !f.isClosed).length, label: t('moderator.activeFixes'), hint: t('moderator.stats.fixesHint') },
  { tab: 'reviews', icon: 'mdi-star', color: 'amber', value: reviewsStore.all.filter(r => !r.deletedAt && !r.hidden).length, label: t('moderator.tabs.reviews'), hint: t('moderator.stats.reviewsHint') },
] as const)

onMounted(() => {
  moderatorStore.watchAll()
  reviewsStore.watchAll()
  contactStore.watchInbox()
  servicesStore.load(true)
})

onUnmounted(() => {
  moderatorStore.stopWatching()
  reviewsStore.stopWatching()
  contactStore.stopWatching()
})
</script>

<template>
  <div>
    <v-container
      class="py-8"
      fluid
    >
      <page-header
        :title="t('moderator.title')"
        :subtitle="t('moderator.subtitle')"
        icon="mdi-shield-account"
      />

      <v-row class="mb-6">
        <v-col
          v-for="stat in stats"
          :key="stat.label"
          cols="6"
          md
        >
          <v-card
            v-tooltip:bottom="stat.hint"
            hover
            variant="tonal"
            :color="stat.color"
            :data-testid="`stat-${stat.tab}`"
            @click="tab = stat.tab"
          >
            <v-card-item>
              <template #prepend>
                <v-icon
                  :icon="stat.icon"
                  size="36"
                />
              </template>
              <v-card-title class="text-headline-medium font-weight-bold">
                {{ stat.value }}
              </v-card-title>
              <v-card-subtitle>{{ stat.label }}</v-card-subtitle>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>

      <v-card elevation="2">
        <v-tabs
          v-model="tab"
          color="primary"
          show-arrows
          slider-color="primary"
        >
          <v-tab
            v-for="item in tabMeta"
            :key="item.value"
            :value="item.value"
            :prepend-icon="item.icon"
          >
            {{ item.label }}
            <v-badge
              v-if="item.badge"
              :content="item.badge"
              color="warning"
              inline
            />
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-tabs-window
          v-model="tab"
          class="pa-6"
        >
          <v-tabs-window-item value="stats">
            <stats-panel />
          </v-tabs-window-item>
          <v-tabs-window-item value="companies">
            <companies-table />
          </v-tabs-window-item>
          <v-tabs-window-item value="services">
            <services-table />
          </v-tabs-window-item>
          <v-tabs-window-item value="users">
            <users-table />
          </v-tabs-window-item>
          <v-tabs-window-item value="fixes">
            <fixes-table />
          </v-tabs-window-item>
          <v-tabs-window-item value="messages">
            <messages-table />
          </v-tabs-window-item>
          <v-tabs-window-item value="reviews">
            <reviews-table />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import RepairList from '~/components/fix/repairList.vue'
import PageHeader from '~/components/pageHeader.vue'
import WeekBoard from '~/components/company/weekBoard.vue'
import { isOnDay, matchesSearch } from '~/models/fix'

definePageMeta({ middleware: ['auth'], role: 'workshop' })

const { t } = useI18n()

const authStore = useAuthStore()
const { company } = storeToRefs(authStore)
const fixesStore = useFixesStore()
const { fixes, historyFixes, watching } = storeToRefs(fixesStore)
const servicesStore = useServicesStore()
const { loading } = storeToRefs(useSharedStore())
const reviewsStore = useReviewsStore()
const { ownRating } = storeToRefs(reviewsStore)

const tab = ref<'active' | 'history'>('active')

/** Week board or card list – remembered per browser. */
const VIEW_KEY = 'company-view'
const view = ref<'week' | 'list'>('week')
onMounted(() => {
  try {
    if (localStorage.getItem(VIEW_KEY) === 'list') view.value = 'list'
  }
  catch {
    // storage unavailable – default view
  }
})
watch(view, (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value)
  }
  catch {
    // storage unavailable
  }
})
const searchedServices = ref<string[]>([])
const onlyToAccept = ref(false)
const onlyToday = ref(false)
const search = ref('')
const historyLoaded = ref(false)

const fixesList = computed(() => {
  let list = tab.value === 'active' ? fixes.value : historyFixes.value
  if (searchedServices.value.length)
    list = list.filter(fix => searchedServices.value.some(s => fix.services.includes(s)))
  if (onlyToAccept.value && tab.value === 'active')
    list = list.filter(fix => fix.notifications.length === 0)
  if (onlyToday.value && tab.value === 'active')
    list = list.filter(fix => isOnDay(fix, new Date()))
  return list.filter(fix => matchesSearch(fix, search.value))
})

const toAcceptCount = computed(() => fixes.value.filter(f => !f.notifications.length).length)
const todayCount = computed(() => fixes.value.filter(f => isOnDay(f, new Date())).length)

// Live: new bookings, cancellations and client decisions show up immediately.
watch(() => company.value?.reference, (ref) => {
  if (!ref) return
  fixesStore.watchActive('companyRef', ref)
  reviewsStore.loadOwnRating(ref)
}, { immediate: true })
onUnmounted(() => fixesStore.stopWatching())

watch(tab, async (value) => {
  if (value === 'history' && company.value && !historyLoaded.value) {
    await fixesStore.getWorkshopHistoryFixes(company.value.reference)
    historyLoaded.value = true
  }
})
</script>

<template>
  <v-container class="py-8">
    <page-header
      :title="t('company.title')"
      :subtitle="company?.name"
      icon="mdi-car-wrench"
    >
      <v-chip
        v-if="ownRating?.count"
        v-tooltip:bottom="t('reviews.ownRatingHint', { count: ownRating.count })"
        color="amber"
        variant="tonal"
        prepend-icon="mdi-star"
        data-testid="own-rating"
      >
        {{ ownRating.average }}
      </v-chip>
      <span v-tooltip:bottom="company?.status === 'approved' ? null : t('company.notApprovedHint')">
        <v-btn
          to="/company/clients"
          prepend-icon="mdi-calendar-plus"
          variant="tonal"
          :disabled="company?.status !== 'approved'"
        >
          {{ t('clients.bookForClient') }}
        </v-btn>
      </span>
    </page-header>

    <v-alert
      v-if="company?.status === 'pending'"
      type="info"
      variant="tonal"
      icon="mdi-timer-sand"
      class="mb-6"
      :title="t('company.pendingTitle')"
      :text="t('company.pendingText')"
      data-testid="pending-banner"
    />
    <v-alert
      v-else-if="company?.status === 'suspended'"
      type="error"
      variant="tonal"
      icon="mdi-cancel"
      class="mb-6"
      :title="t('company.suspendedTitle')"
      :text="t('company.suspendedText')"
    />

    <v-card
      variant="tonal"
      class="pa-4 mb-6"
    >
      <v-row class="align-center">
        <v-col
          cols="12"
          md="6"
        >
          <v-tabs
            v-model="tab"
            color="primary"
          >
            <v-tab
              value="active"
              prepend-icon="mdi-progress-wrench"
            >
              {{ t('company.activeFixes') }}
            </v-tab>
            <v-tab
              value="history"
              prepend-icon="mdi-history"
            >
              {{ t('navBar.user.history') }}
            </v-tab>
          </v-tabs>
        </v-col>

        <v-col
          cols="12"
          md="6"
          class="d-flex justify-md-end"
        >
          <v-switch
            v-model="onlyToAccept"
            v-tooltip:top="t('company.toBeAcceptedHint')"
            color="primary"
            hide-details
            :disabled="tab !== 'active'"
          >
            <template #label>
              {{ t('company.toBeAccepted') }}
              <v-badge
                v-if="toAcceptCount"
                :content="toAcceptCount"
                color="error"
                inline
              />
            </template>
          </v-switch>
        </v-col>

        <v-col
          cols="12"
          md="6"
        >
          <v-text-field
            v-model="search"
            :label="t('company.search')"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            data-testid="repair-search"
          />
        </v-col>

        <v-col
          cols="12"
          md="6"
          class="d-flex align-center"
        >
          <v-switch
            v-model="onlyToday"
            color="primary"
            hide-details
            :disabled="tab !== 'active'"
            data-testid="only-today"
          >
            <template #label>
              {{ t('company.today') }}
              <v-badge
                v-if="todayCount"
                :content="todayCount"
                color="primary"
                inline
              />
            </template>
          </v-switch>
        </v-col>

        <v-col cols="12">
          <v-select
            v-model="searchedServices"
            :label="t('company.services')"
            :items="servicesStore.options"
            prepend-inner-icon="mdi-filter-variant"
            chips
            closable-chips
            multiple
            clearable
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <div
      v-if="tab === 'active'"
      class="d-flex justify-end mb-4"
    >
      <v-btn-toggle
        v-model="view"
        mandatory
        variant="outlined"
        density="comfortable"
        rounded="xl"
        color="primary"
        data-testid="view-toggle"
      >
        <v-btn
          value="week"
          prepend-icon="mdi-calendar-week"
        >
          {{ t('board.week') }}
        </v-btn>
        <v-btn
          value="list"
          prepend-icon="mdi-view-grid-outline"
        >
          {{ t('board.list') }}
        </v-btn>
      </v-btn-toggle>
    </div>

    <week-board
      v-if="tab === 'active' && view === 'week' && company"
      :fixes="fixesList"
      :workshop="company"
    />
    <repair-list
      v-else
      :fixes="fixesList"
      mode="workshop"
      :loading="tab === 'active' ? watching : loading"
    />
  </v-container>
</template>

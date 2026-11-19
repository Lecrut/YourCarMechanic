<script setup lang="ts">
import type { IFeedEvent } from '~/models/feed'
import { relativeTime } from '~/models/feed'
import RepairDetails from '~/components/fix/repairDetails.vue'
import { formatDateToString } from '~/utils/time'

/** Bell with the notification feed (customers and workshops). */
const { t } = useI18n()
const authStore = useAuthStore()
const feedStore = useFeedStore()
const { events, unread } = storeToRefs(feedStore)

const open = ref(false)
const selectedRef = ref<string | null>(null)
const showDetails = ref(false)

const selected = computed(() => (selectedRef.value ? feedStore.fixByRef(selectedRef.value) : null))
const mode = computed(() => (authStore.role === 'workshop' ? 'workshop' : 'user'))

const meta: Record<string, { icon: string, color: string }> = {
  newBooking: { icon: 'mdi-calendar-plus', color: 'primary' },
  reminder: { icon: 'mdi-alarm', color: 'info' },
  bookedForYou: { icon: 'mdi-calendar-account', color: 'warning' },
  getCar: { icon: 'mdi-car-arrow-right', color: 'primary' },
  addQuote: { icon: 'mdi-file-document-edit-outline', color: 'warning' },
  quoteAccepted: { icon: 'mdi-file-document-check-outline', color: 'success' },
  addGiveBackTime: { icon: 'mdi-clock-outline', color: 'info' },
  addExpense: { icon: 'mdi-cash-plus', color: 'warning' },
  giveBackCar: { icon: 'mdi-car-key', color: 'success' },
  changeProposed: { icon: 'mdi-swap-horizontal', color: 'warning' },
  changeAccepted: { icon: 'mdi-check-circle-outline', color: 'success' },
  changeRejected: { icon: 'mdi-close-circle-outline', color: 'error' },
  bookingConfirmed: { icon: 'mdi-calendar-check', color: 'success' },
  userCancel: { icon: 'mdi-calendar-remove', color: 'error' },
  workshopCancel: { icon: 'mdi-calendar-remove', color: 'error' },
  moderatorCancel: { icon: 'mdi-shield-alert-outline', color: 'error' },
}

const isUnread = (e: IFeedEvent) => !feedStore.lastSeen || e.at > feedStore.lastSeen

function ago(e: IFeedEvent) {
  const r = relativeTime(e.at)
  return r.unit === 'now' ? t('feed.now') : t(`feed.ago.${r.unit}`, { value: r.value })
}

function openEvent(e: IFeedEvent) {
  selectedRef.value = e.fixRef
  showDetails.value = true
  open.value = false
}

// Opening the menu means the user saw the news.
watch(open, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen) feedStore.markAllRead()
})

// Follow the signed-in user / company.
watch(() => [authStore.user?.reference, authStore.role, authStore.company?.reference], () => feedStore.start(), { immediate: true })
onUnmounted(() => feedStore.stop())
</script>

<template>
  <v-menu
    v-model="open"
    location="bottom end"
    :close-on-content-click="false"
  >
    <template #activator="{ props: menuProps }">
      <v-btn
        v-tooltip:bottom="t('feed.title')"
        v-bind="menuProps"
        icon
        variant="text"
        color="default"
        :aria-label="t('feed.title')"
        data-testid="feed-bell"
      >
        <v-badge
          :model-value="unread > 0"
          :content="unread > 9 ? '9+' : unread"
          color="error"
        >
          <v-icon :icon="unread ? 'mdi-bell-ring' : 'mdi-bell-outline'" />
        </v-badge>
      </v-btn>
    </template>

    <v-card
      width="380"
      max-height="520"
      class="d-flex flex-column"
      data-testid="feed-menu"
    >
      <v-card-item :title="t('feed.title')">
        <template #append>
          <v-btn
            v-if="unread"
            variant="text"
            size="small"
            data-testid="feed-mark-read"
            @click="feedStore.markAllRead()"
          >
            {{ t('feed.markRead') }}
          </v-btn>
        </template>
      </v-card-item>
      <v-divider />

      <v-list
        v-if="events.length"
        class="overflow-y-auto"
        lines="two"
        density="compact"
        nav
      >
        <v-list-item
          v-for="event in events"
          :key="event.id"
          :active="isUnread(event)"
          color="primary"
          rounded="lg"
          data-testid="feed-item"
          @click="openEvent(event)"
        >
          <template #prepend>
            <v-avatar
              :color="meta[event.type]?.color ?? 'primary'"
              variant="tonal"
              size="36"
            >
              <v-icon
                :icon="meta[event.type]?.icon ?? 'mdi-bell'"
                size="20"
              />
            </v-avatar>
          </template>
          <v-list-item-title class="text-wrap">
            {{ t(`feed.events.${event.type}`, { car: event.car, client: event.client, cost: event.cost ?? 0, when: formatDateToString(event.visit) }) }}
          </v-list-item-title>
          <v-list-item-subtitle>{{ ago(event) }}</v-list-item-subtitle>
          <template #append>
            <v-badge
              v-if="isUnread(event)"
              dot
              inline
              color="error"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-empty-state
        v-else
        icon="mdi-bell-sleep-outline"
        :title="t('feed.empty')"
        size="64"
      />
    </v-card>
  </v-menu>

  <repair-details
    v-if="selected"
    v-model="showDetails"
    :fix="selected"
    :mode="mode"
  />
</template>

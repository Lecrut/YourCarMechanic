<script setup lang="ts">
import type { IGarageCar } from '~/types/garage'
import { awaitsClientDecision, lastStatus, statusColor, totalCost } from '~/domain/fix'
import type { IFix } from '~/types/fix'
import { formatRange } from '~/utils/format'
import { notificationLabel } from '~/utils/options'
import { formatDateToString } from '~/utils/time'
import RepairDetails from '~/components/fix/repairDetails.vue'
import CarHistoryDialog from '~/components/user/carHistoryDialog.vue'

/** Garage tile: a car with its open repairs and recent history. */
const props = defineProps<{ tile: IGarageCar }>()

const { t } = useI18n()
const servicesStore = useServicesStore()

const HISTORY_PREVIEW = 3
const showAllHistory = ref(false)
const showHistoryDialog = ref(false)
const selectedRef = ref<string | null>(null)

const selected = computed(() =>
  [...props.tile.active, ...props.tile.history].find(f => f.reference === selectedRef.value) ?? null)
const history = computed(() => (showAllHistory.value ? props.tile.history : props.tile.history.slice(0, HISTORY_PREVIEW)))
const atWorkshop = computed(() => props.tile.active.some(f => f.notifications.some(n => n.notificationType === 'getCar')))
const decisions = computed(() => props.tile.active.filter(awaitsClientDecision).length)

const statusOf = (fix: IFix) => {
  const last = lastStatus(fix)
  return last ? notificationLabel(t, last.notificationType) : t('moderator.statusNew')
}
const services = (fix: IFix) => fix.services.map(servicesStore.label).join(', ')
const money = (fix: IFix) => {
  const cost = totalCost(fix)
  if (cost) return `${cost} PLN`
  return fix.estimate && !fix.isClosed ? `≈ ${formatRange(fix.estimate)}` : ''
}
</script>

<template>
  <v-card
    class="h-100 d-flex flex-column"
    elevation="2"
    data-testid="garage-car"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          :color="tile.active.length ? 'primary' : 'surface-variant'"
          size="52"
        >
          <v-icon
            icon="mdi-car-side"
            size="28"
          />
        </v-avatar>
      </template>
      <v-card-title class="font-weight-bold text-wrap">
        {{ tile.car.manufacturer }} {{ tile.car.model }}
      </v-card-title>
      <v-card-subtitle class="text-wrap">
        {{ tile.car.productionYear }}<template v-if="tile.car.vin">
          · {{ tile.car.vin }}
        </template>
        <template v-if="!tile.saved">
          · {{ t('garage.oneOff') }}
        </template>
      </v-card-subtitle>
      <template #append>
        <div class="d-flex flex-column align-end ga-1">
          <v-chip
            v-if="atWorkshop"
            color="primary"
            size="small"
            variant="flat"
            prepend-icon="mdi-garage-open-variant"
          >
            {{ t('garage.atWorkshop') }}
          </v-chip>
          <v-chip
            v-if="decisions"
            color="warning"
            size="small"
            variant="flat"
            prepend-icon="mdi-bell-alert"
          >
            {{ t('proposal.yourDecision') }}
          </v-chip>
        </div>
      </template>
    </v-card-item>

    <v-divider />

    <v-list
      class="flex-grow-1 py-1"
      lines="two"
      density="comfortable"
      nav
    >
      <v-list-subheader v-if="tile.active.length">
        {{ t('garage.active') }}
      </v-list-subheader>
      <v-list-item
        v-for="fix in tile.active"
        :key="fix.reference"
        :active="awaitsClientDecision(fix)"
        color="warning"
        rounded="lg"
        data-testid="garage-active"
        @click="selectedRef = fix.reference"
      >
        <template #prepend>
          <v-avatar
            :color="statusColor(fix)"
            size="10"
            class="mr-3"
          />
        </template>
        <v-list-item-title class="d-flex align-center ga-2">
          <span class="font-weight-medium">{{ formatDateToString(fix.date) }}</span>
          <v-chip
            :color="statusColor(fix)"
            size="x-small"
            variant="tonal"
          >
            {{ statusOf(fix) }}
          </v-chip>
        </v-list-item-title>
        <v-list-item-subtitle>{{ services(fix) }}</v-list-item-subtitle>
        <template #append>
          <span class="text-body-small font-weight-bold text-no-wrap ml-2">{{ money(fix) }}</span>
        </template>
      </v-list-item>

      <v-list-subheader v-if="tile.history.length">
        {{ t('garage.history') }}
      </v-list-subheader>
      <v-list-item
        v-for="fix in history"
        :key="fix.reference"
        rounded="lg"
        data-testid="garage-history"
        @click="selectedRef = fix.reference"
      >
        <template #prepend>
          <v-icon
            :icon="statusColor(fix) === 'error' ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
            :color="statusColor(fix)"
            size="small"
            class="mr-3"
          />
        </template>
        <v-list-item-title class="text-body-medium">
          {{ formatDateToString(fix.date).slice(0, 10) }} · {{ statusOf(fix) }}
        </v-list-item-title>
        <v-list-item-subtitle>{{ services(fix) }}</v-list-item-subtitle>
        <template #append>
          <v-icon
            v-if="fix.reviewed"
            v-tooltip="t('reviews.reviewed')"
            icon="mdi-star-check"
            color="amber"
            size="small"
            class="mr-1"
          />
          <span class="text-body-small text-no-wrap ml-2">{{ money(fix) }}</span>
        </template>
      </v-list-item>
      <div
        v-if="tile.history.length > HISTORY_PREVIEW"
        class="text-center"
      >
        <v-btn
          variant="text"
          size="small"
          :append-icon="showAllHistory ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          data-testid="garage-more"
          @click="showAllHistory = !showAllHistory"
        >
          {{ showAllHistory ? t('garage.less') : t('garage.more', { count: tile.history.length - HISTORY_PREVIEW }) }}
        </v-btn>
      </div>

      <v-empty-state
        v-if="!tile.active.length && !tile.history.length"
        icon="mdi-car-wrench"
        :title="t('garage.noRepairs')"
        size="48"
      />
    </v-list>

    <v-divider />
    <v-card-actions>
      <v-btn
        v-if="tile.saved"
        variant="tonal"
        prepend-icon="mdi-calendar-plus"
        :to="`/user?car=${encodeURIComponent(tile.car.reference)}`"
        data-testid="garage-book"
      >
        {{ t('garage.book') }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="tile.saved"
        variant="text"
        prepend-icon="mdi-history"
        @click="showHistoryDialog = true"
      >
        {{ t('universal.history') }}
      </v-btn>
    </v-card-actions>
  </v-card>

  <repair-details
    v-if="selected"
    :model-value="Boolean(selected)"
    :fix="selected"
    mode="user"
    @update:model-value="selectedRef = null"
  />
  <car-history-dialog
    v-if="tile.saved"
    v-model="showHistoryDialog"
    :car="tile.car"
  />
</template>

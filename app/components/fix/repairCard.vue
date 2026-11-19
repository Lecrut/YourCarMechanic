<script setup lang="ts">
import { awaitsClientDecision, canBeReviewed, fixProgress, type IFix, lastStatus, statusColor, totalCost, type ViewerMode } from '~/models/fix'
import { formatRange } from '~/models/priceList'
import { notificationLabel } from '~/composables/notifications'
import { mapINotification } from '~/models/notification'
import { formatDateToString } from '~/utils/time'
import RepairDetails from '~/components/fix/repairDetails.vue'
import ReviewDialog from '~/components/user/reviewDialog.vue'

const props = defineProps<{
  fix: IFix
  mode: ViewerMode
}>()

const { t } = useI18n()

const fixesStore = useFixesStore()
const servicesStore = useServicesStore()

const showDetails = ref(false)
const showReview = ref(false)
const confirmCancel = ref(false)
const { loading } = storeToRefs(useSharedStore())

const statusText = computed(() => {
  const last = lastStatus(props.fix)
  return last ? notificationLabel(t, last.notificationType) : t('moderator.statusNew')
})
const cost = computed(() => totalCost(props.fix))

const progress = computed(() => fixProgress(props.fix))
const needsDecision = computed(() => awaitsClientDecision(props.fix))

/** Clients can cancel before the visit, workshops after it (no-show) – only while no status was added. */
const canBeCanceled = computed(() => {
  if (props.mode === 'moderator' || props.fix.isClosed || props.fix.notifications.length) return false
  const isBeforeVisit = new Date() < props.fix.date
  return props.mode === 'workshop' ? !isBeforeVisit : isBeforeVisit
})

async function cancelRepair() {
  await fixesStore.addNotification(props.fix, mapINotification({
    notificationType: props.mode === 'workshop' ? 'workshopCancel' : 'userCancel',
  }))
  confirmCancel.value = false
}
</script>

<template>
  <v-card
    variant="tonal"
    :color="needsDecision ? 'warning' : undefined"
    hover
    class="h-100 d-flex flex-column"
    data-testid="repair-card"
    @click="showDetails = true"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          color="primary"
          variant="tonal"
        >
          <v-icon icon="mdi-car" />
        </v-avatar>
      </template>
      <v-card-title>
        {{ fix.car.manufacturer }} {{ fix.car.model }}
      </v-card-title>
      <v-card-subtitle>
        {{ fix.car.productionYear }}<template v-if="mode !== 'user' && fix.clientName">
          · {{ fix.clientName }}
        </template>
      </v-card-subtitle>
      <template #append>
        <v-chip
          v-if="needsDecision"
          color="warning"
          size="small"
          variant="flat"
          prepend-icon="mdi-bell-alert"
          data-testid="decision-chip"
        >
          {{ mode === 'user' ? t('proposal.yourDecision') : t('proposal.waiting') }}
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text class="flex-grow-1">
      <div class="d-flex align-center flex-wrap ga-2 mb-2">
        <v-chip
          :color="statusColor(fix)"
          size="small"
          variant="flat"
          data-testid="status-chip"
        >
          {{ statusText }}
        </v-chip>
        <v-spacer />
        <span
          v-if="cost"
          v-tooltip:top="t('repairs.costHint')"
          class="text-title-small font-weight-bold"
          data-testid="card-cost"
        >{{ cost }} PLN</span>
        <span
          v-else-if="fix.estimate"
          v-tooltip:top="t('pricing.estimate')"
          class="text-body-small text-medium-emphasis"
        >≈ {{ formatRange(fix.estimate) }}</span>
      </div>

      <div class="d-flex align-center ga-2 mb-2">
        <v-icon
          icon="mdi-calendar-blank"
          color="primary"
          size="small"
        />
        {{ formatDateToString(fix.date) }}
      </div>

      <v-chip-group column>
        <v-chip
          v-for="item in fix.services"
          :key="item"
          density="comfortable"
          size="small"
        >
          {{ servicesStore.label(item) }}
        </v-chip>
      </v-chip-group>
    </v-card-text>

    <v-card-actions>
      <v-btn
        variant="text"
        size="small"
        append-icon="mdi-chevron-right"
        data-testid="open-details"
        @click.stop="showDetails = true"
      >
        {{ t('notifications.openDetails') }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="mode === 'user' && canBeReviewed(fix)"
        variant="flat"
        color="amber"
        size="small"
        prepend-icon="mdi-star"
        data-testid="review-repair"
        @click.stop="showReview = true"
      >
        {{ t('reviews.rate') }}
      </v-btn>
      <v-btn
        v-if="canBeCanceled"
        variant="text"
        color="error"
        size="small"
        data-testid="cancel-repair"
        @click.stop="confirmCancel = true"
      >
        {{ t('notifications.cancel') }}
      </v-btn>
    </v-card-actions>

    <v-progress-linear
      :model-value="progress"
      :color="progress === 0 ? 'error' : progress === 100 ? 'success' : 'primary'"
    />
  </v-card>

  <repair-details
    v-model="showDetails"
    :fix="fix"
    :mode="mode"
  />

  <v-dialog
    v-model="confirmCancel"
    max-width="440"
  >
    <v-card
      :title="t('repairs.cancelTitle')"
      :text="t('repairs.cancelText', { date: formatDateToString(fix.date) })"
      prepend-icon="mdi-calendar-remove"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="confirmCancel = false"
        >
          {{ t('repairs.keep') }}
        </v-btn>
        <v-btn
          color="error"
          :loading="loading"
          data-testid="confirm-cancel"
          @click="cancelRepair"
        >
          {{ t('notifications.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <review-dialog
    v-if="mode === 'user'"
    v-model="showReview"
    :fix="fix"
  />
</template>

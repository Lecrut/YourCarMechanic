<script setup lang="ts">
import type { ICar } from '~/models/car'
import { fixesForCar, type IFix, lastStatus, statusColor, totalCost } from '~/models/fix'
import { notificationLabel } from '~/composables/notifications'
import { formatDateToString } from '~/utils/time'
import RepairDetails from '~/components/fix/repairDetails.vue'

/** Every repair of one of the customer's cars, with mileage and money spent. */
const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{ car: ICar }>()

const { t } = useI18n()
const authStore = useAuthStore()
const fixesStore = useFixesStore()
const workshopStore = useWorkshopStore()
const servicesStore = useServicesStore()
const { loading } = storeToRefs(useSharedStore())

const repairs = ref<IFix[]>([])
const workshopNames = ref<Record<string, string>>({})
const selectedRef = ref<string | null>(null)
const showDetails = ref(false)

const selected = computed(() => repairs.value.find(r => r.reference === selectedRef.value) ?? null)
const spent = computed(() => repairs.value.reduce((sum, r) => sum + (totalCost(r) ?? 0), 0))
const lastMileage = computed(() => repairs.value.find(r => r.carMillage > 0)?.carMillage ?? null)

const statusOf = (fix: IFix) => {
  const last = lastStatus(fix)
  return last ? notificationLabel(t, last.notificationType) : t('moderator.statusNew')
}

watch(isDialogShown, async (shown) => {
  if (!shown || !authStore.user) return
  const all = await fixesStore.getAllUserFixes(authStore.user.reference)
  repairs.value = fixesForCar(all ?? [], props.car)
  for (const companyRef of new Set(repairs.value.map(r => r.companyRef))) {
    const w = await workshopStore.getWorkshopByRef(companyRef)
    if (w) workshopNames.value[companyRef] = w.name
  }
})

function open(fix: IFix) {
  selectedRef.value = fix.reference
  showDetails.value = true
}
</script>

<template>
  <v-dialog
    v-model="isDialogShown"
    max-width="760"
    scrollable
  >
    <v-card
      :title="t('carHistory.title', { car: `${car.manufacturer} ${car.model}` })"
      :subtitle="car.vin || t('userProfile.vinNotDefined')"
      prepend-icon="mdi-history"
      data-testid="car-history"
    >
      <v-card-text>
        <v-row class="mb-2">
          <v-col cols="4">
            <v-card
              variant="tonal"
              color="primary"
              class="pa-3 text-center"
            >
              <div class="text-headline-small font-weight-bold">
                {{ repairs.length }}
              </div>
              <div class="text-body-small">
                {{ t('carHistory.visits') }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card
              variant="tonal"
              color="success"
              class="pa-3 text-center"
            >
              <div
                class="text-headline-small font-weight-bold"
                data-testid="car-history-spent"
              >
                {{ spent }} PLN
              </div>
              <div class="text-body-small">
                {{ t('carHistory.spent') }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card
              variant="tonal"
              color="info"
              class="pa-3 text-center"
            >
              <div class="text-headline-small font-weight-bold">
                {{ lastMileage ? `${lastMileage.toLocaleString()} km` : '—' }}
              </div>
              <div class="text-body-small">
                {{ t('carHistory.lastMileage') }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div
          v-if="loading && !repairs.length"
          class="text-center py-6"
        >
          <v-progress-circular
            indeterminate
            color="primary"
          />
        </div>

        <v-timeline
          v-else-if="repairs.length"
          side="end"
          density="compact"
          align="start"
        >
          <v-timeline-item
            v-for="fix in repairs"
            :key="fix.reference"
            :dot-color="statusColor(fix)"
            size="small"
          >
            <v-card
              variant="tonal"
              hover
              data-testid="car-history-item"
              @click="open(fix)"
            >
              <v-card-item
                :title="formatDateToString(fix.date)"
                :subtitle="`${workshopNames[fix.companyRef] ?? ''}${fix.carMillage ? ` · ${fix.carMillage.toLocaleString()} km` : ''}`"
              >
                <template #append>
                  <v-chip
                    :color="statusColor(fix)"
                    size="small"
                    variant="flat"
                  >
                    {{ statusOf(fix) }}
                  </v-chip>
                </template>
              </v-card-item>
              <v-card-text class="d-flex align-center flex-wrap ga-1">
                <v-chip
                  v-for="key in fix.services"
                  :key="key"
                  size="x-small"
                  variant="outlined"
                >
                  {{ servicesStore.label(key) }}
                </v-chip>
                <v-spacer />
                <span
                  v-if="totalCost(fix)"
                  class="font-weight-bold"
                >{{ totalCost(fix) }} PLN</span>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>

        <v-empty-state
          v-else
          icon="mdi-car-clock"
          :title="t('carHistory.empty')"
          size="64"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="isDialogShown = false"
        >
          {{ t('universal.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <repair-details
    v-if="selected"
    v-model="showDetails"
    :fix="selected"
    mode="user"
  />
</template>

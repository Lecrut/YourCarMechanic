<script setup lang="ts">
import type { IFix } from '~/types/fix'
import type { IWorkshop } from '~/types/workshop'
import { formatRelative, formatDateToString } from '~/utils/time'

import { downloadIcs } from '~/utils/calendar'
import RepairDetails from '~/components/fix/repairDetails.vue'

/** Hero card with the customer's nearest visit. */
const props = defineProps<{ fix: IFix }>()

const { t, locale } = useI18n()
const workshopStore = useWorkshopStore()
const citiesJsonStore = useCitiesJsonStore()
const servicesStore = useServicesStore()

const workshop = ref<IWorkshop | null>(null)
const showDetails = ref(false)

const countdown = computed(() => formatRelative(props.fix.date, locale.value))
const address = computed(() => (workshop.value
  ? `${citiesJsonStore.getCityName(workshop.value.city)}, ${workshop.value.address}`
  : ''))

function addToCalendar() {
  downloadIcs({
    uid: `${props.fix.reference.replace('/', '-')}@twojmechanik`,
    title: `${t('navBar.title')}: ${workshop.value?.name ?? ''} – ${props.fix.car.manufacturer} ${props.fix.car.model}`,
    start: props.fix.date,
    durationMinutes: 60,
    location: address.value || undefined,
    description: props.fix.services.map(servicesStore.label).join(', '),
  }, 'wizyta-w-warsztacie.ics')
}

watch(() => props.fix.companyRef, async (companyRef) => {
  workshop.value = companyRef ? await workshopStore.getWorkshopByRef(companyRef) : null
}, { immediate: true })
</script>

<template>
  <v-card
    color="primary"
    variant="flat"
    class="mb-6"
    data-testid="next-visit"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          color="white"
          size="56"
        >
          <v-icon
            icon="mdi-calendar-clock"
            color="primary"
            size="30"
          />
        </v-avatar>
      </template>
      <v-card-subtitle class="text-uppercase">
        {{ t('nextVisit.title') }} · {{ countdown }}
      </v-card-subtitle>
      <v-card-title class="text-headline-small font-weight-bold text-wrap">
        {{ formatDateToString(fix.date) }}
      </v-card-title>
    </v-card-item>
    <v-card-text>
      <div class="d-flex flex-wrap ga-4 text-body-large">
        <span class="d-flex align-center ga-1">
          <v-icon
            icon="mdi-car"
            size="small"
          />
          {{ fix.car.manufacturer }} {{ fix.car.model }}
        </span>
        <span
          v-if="workshop"
          class="d-flex align-center ga-1"
        >
          <v-icon
            icon="mdi-garage"
            size="small"
          />
          {{ workshop.name }}
        </span>
        <span
          v-if="address"
          class="d-flex align-center ga-1"
        >
          <v-icon
            icon="mdi-map-marker-outline"
            size="small"
          />
          {{ address }}
        </span>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn
        variant="flat"
        color="white"
        prepend-icon="mdi-calendar-export"
        data-testid="next-visit-calendar"
        @click="addToCalendar"
      >
        {{ t('repairs.addToCalendar') }}
      </v-btn>
      <v-btn
        variant="text"
        color="white"
        append-icon="mdi-chevron-right"
        @click="showDetails = true"
      >
        {{ t('notifications.openDetails') }}
      </v-btn>
    </v-card-actions>
  </v-card>

  <repair-details
    v-model="showDetails"
    :fix="fix"
    mode="user"
  />
</template>

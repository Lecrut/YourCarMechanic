<script setup lang="ts">
import type { IWorkshop } from '~/types/workshop'
import type { Range } from '~/types/priceList'
import { formatDuration, formatRange } from '~/utils/format'
import type { IRatingSummary } from '~/types/review'
import type { IPromotion } from '~/types/promotion'
import { formatDateToString } from '~/utils/time'
import FreeDates from '~/components/user/freeDates.vue'

const props = defineProps<{
  workshop: IWorkshop
  isPresentation: boolean
  /** Price-list estimate for the current booking (undefined = don't show the row). */
  estimate?: Range | null
  rating?: IRatingSummary
  /** Running promotion for the selected services, and the estimate without it. */
  promotion?: IPromotion | null
  estimateBefore?: Range | null
  /** Expected visit length for the selected services (hours). */
  durationHours?: number
  selected?: boolean
}>()

const emit = defineEmits<{
  book: [workshop: IWorkshop, date: Date]
}>()

const { t } = useI18n()

const citiesJsonStore = useCitiesJsonStore()
const servicesStore = useServicesStore()

const showDialog = ref(false)

const cityName = computed(() => citiesJsonStore.getCityName(props.workshop.city))

const { locale } = useI18n()
/** e.g. "pn, wt, śr, czw, pt" – days in the order Monday → Sunday. */
const workingDaysLabel = computed(() => [1, 2, 3, 4, 5, 6, 0]
  .filter(d => props.workshop.workingDays.includes(d))
  .map(d => new Date(2024, 0, 7 + d).toLocaleDateString(locale.value === 'pl' ? 'pl-PL' : 'en-GB', { weekday: 'short' }))
  .join(', '))
</script>

<template>
  <v-card
    :variant="selected ? 'flat' : 'tonal'"
    :color="selected ? 'primary' : undefined"
    :hover="!isPresentation"
    class="my-2 h-100 d-flex flex-column"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          color="primary"
          variant="tonal"
        >
          <v-icon icon="mdi-garage" />
        </v-avatar>
      </template>
      <v-card-title class="font-weight-bold d-flex align-center ga-2">
        <span class="text-truncate">{{ workshop.name }}</span>
        <v-chip
          v-if="promotion"
          v-tooltip:top="t('promotions.badgeHint', { title: promotion.title, date: formatDateToString(promotion.validTo).slice(0, 10) })"
          color="error"
          size="small"
          variant="flat"
          prepend-icon="mdi-tag"
          data-testid="promotion-badge"
        >
          −{{ promotion.percent }}%
        </v-chip>
      </v-card-title>
      <v-card-subtitle v-if="rating">
        <div
          v-if="rating.count"
          class="d-flex align-center ga-1"
        >
          <v-rating
            :model-value="rating.average"
            density="compact"
            size="x-small"
            half-increments
            readonly
            color="amber"
          />
          <span>{{ rating.average }} ({{ rating.count }})</span>
        </div>
        <span v-else>{{ t('reviews.none') }}</span>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="flex-grow-1">
      <v-list
        density="compact"
        bg-color="transparent"
        class="pa-0"
      >
        <v-list-item
          prepend-icon="mdi-map-marker-outline"
          :title="`${cityName} ${workshop.address}`"
        />
        <v-list-item
          prepend-icon="mdi-phone-outline"
          :title="workshop.phone"
          :href="`tel:${workshop.phone}`"
        />
        <v-list-item
          prepend-icon="mdi-clock-outline"
          :title="`${workshop.openingTime}:00 – ${workshop.closingTime}:00`"
          :subtitle="workingDaysLabel"
          data-testid="opening-hours"
        />
        <v-list-item
          v-if="durationHours"
          prepend-icon="mdi-timer-outline"
          :title="formatDuration(durationHours)"
          :subtitle="t('duration.expected')"
          data-testid="duration"
        />
        <v-list-item
          v-if="estimate !== undefined"
          prepend-icon="mdi-cash-multiple"
          :title="estimate ? formatRange(estimate) : t('pricing.noEstimate')"
          :subtitle="t('pricing.estimate')"
          data-testid="estimate"
        >
          <template
            v-if="promotion && estimateBefore && estimate && estimateBefore.max !== estimate.max"
            #append
          >
            <span
              class="text-body-small text-medium-emphasis text-decoration-line-through"
              data-testid="estimate-before"
            >{{ formatRange(estimateBefore) }}</span>
          </template>
        </v-list-item>
      </v-list>

      <v-chip-group column>
        <v-chip
          v-for="item in workshop.services"
          :key="item"
          density="comfortable"
          size="small"
        >
          {{ servicesStore.label(item) }}
        </v-chip>
      </v-chip-group>
    </v-card-text>

    <v-card-actions v-if="!isPresentation">
      <v-btn
        block
        variant="tonal"
        prepend-icon="mdi-calendar"
        data-testid="available-dates"
        @click="showDialog = true"
      >
        {{ t('userBookFix.stepper.third.availableDates') }}
      </v-btn>
    </v-card-actions>
  </v-card>

  <free-dates
    v-if="!isPresentation"
    v-model="showDialog"
    :workshop="workshop"
    :duration-hours="durationHours"
    @select="(date: Date) => emit('book', workshop, date)"
  />
</template>

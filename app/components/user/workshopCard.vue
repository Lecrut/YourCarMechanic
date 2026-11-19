<script setup lang="ts">
import type { IWorkshop } from '~/models/workshop'
import { formatRange, type Range } from '~/models/priceList'
import type { IRatingSummary } from '~/models/review'
import FreeDates from '~/components/user/freeDates.vue'

const props = defineProps<{
  workshop: IWorkshop
  isPresentation: boolean
  /** Price-list estimate for the current booking (undefined = don't show the row). */
  estimate?: Range | null
  rating?: IRatingSummary
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
      <v-card-title class="font-weight-bold">
        {{ workshop.name }}
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
        />
        <v-list-item
          v-if="estimate !== undefined"
          prepend-icon="mdi-cash-multiple"
          :title="estimate ? formatRange(estimate) : t('pricing.noEstimate')"
          :subtitle="t('pricing.estimate')"
          data-testid="estimate"
        />
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
    @select="(date: Date) => emit('book', workshop, date)"
  />
</template>

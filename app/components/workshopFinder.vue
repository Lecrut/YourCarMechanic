<script setup lang="ts">
import type { IWorkshop } from '~/models/workshop'
import type { IRatingSummary } from '~/models/review'
import { formatDistance, placeWorkshop, rankWorkshops, type RankedWorkshop, type WorkshopSort } from '~/models/geo'
import WorkshopMap, { type MapMarker } from '~/components/map/workshopMap.vue'

/**
 * Workshops on a map with a synced list next to it: where am I (city or my location),
 * radius, sort by distance / rating / number of reviews. Each list card gets extra content
 * through the `item` slot (estimate and free hours while booking, price list when browsing).
 */
const props = withDefaults(defineProps<{
  workshops: IWorkshop[]
  ratings: Record<string, IRatingSummary>
  loading?: boolean
  selectedRef?: string | null
  mapHeight?: number
}>(), { loading: false, selectedRef: null, mapHeight: 620 })

const emit = defineEmits<{ select: [workshop: IWorkshop] }>()

defineSlots<{
  filters?: () => unknown
  item?: (props: { item: RankedWorkshop }) => unknown
}>()

const { t, locale } = useI18n()
const locationStore = useLocationStore()
const { origin, city, radiusKm, locating, source } = storeToRefs(locationStore)
const citiesJsonStore = useCitiesJsonStore()
const sharedStore = useSharedStore()

const sort = ref<WorkshopSort>(origin.value ? 'distance' : 'rating')
const highlighted = ref<string | null>(null)
const focused = ref<string | null>(props.selectedRef)

const radiusOptions = computed(() => [
  ...[10, 25, 50, 100].map(km => ({ value: km, title: t('finder.radius', { km }) })),
  { value: null, title: t('finder.anywhere') },
])

const placed = computed(() => props.workshops
  .map(w => placeWorkshop(w, citiesJsonStore.getCityLocation))
  .filter((p): p is NonNullable<typeof p> => p !== null))

const ranked = computed(() => rankWorkshops(placed.value, props.ratings, origin.value, sort.value, origin.value ? radiusKm.value : null))
/** Outside the radius – offered when nothing is close. */
const hiddenByRadius = computed(() => placed.value.length - ranked.value.length)

const markers = computed<MapMarker[]>(() => ranked.value.map(r => ({
  id: r.workshop.reference,
  position: r.position,
  label: r.workshop.name,
  badge: r.rating.count ? r.rating.average.toFixed(1) : undefined,
  approximate: r.approximate,
})))

async function useMyLocation() {
  try {
    await locationStore.useGps()
    sort.value = 'distance'
  }
  catch (e) {
    sharedStore.fail(e)
  }
}

function chooseCity(key: string | null) {
  locationStore.chooseCity(key)
  if (key) sort.value = 'distance'
}

function focus(workshopRef: string) {
  focused.value = workshopRef
  document.getElementById(`finder-${workshopRef.replace('/', '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function pick(item: RankedWorkshop) {
  focused.value = item.workshop.reference
  emit('select', item.workshop)
}

onMounted(() => {
  citiesJsonStore.getCitiesFromJson()
  if (!origin.value) locationStore.restore()
  if (origin.value) sort.value = 'distance'
})

watch(origin, (value) => {
  if (!value && sort.value === 'distance') sort.value = 'rating'
})
</script>

<template>
  <v-card
    class="pa-4 mb-4"
    elevation="2"
    data-testid="finder-bar"
  >
    <v-row
      class="align-center"
      dense
    >
      <v-col
        cols="12"
        md="5"
      >
        <v-autocomplete
          :model-value="source === 'city' ? city : null"
          :items="citiesJsonStore.citiesFromJson"
          :label="source === 'gps' ? t('finder.myLocation') : t('finder.where')"
          :placeholder="source === 'gps' ? t('finder.myLocation') : t('finder.wherePlaceholder')"
          :prepend-inner-icon="source === 'gps' ? 'mdi-crosshairs-gps' : 'mdi-map-marker-outline'"
          clearable
          hide-details
          data-testid="finder-city"
          @update:model-value="chooseCity"
        >
          <template #append>
            <v-btn
              v-tooltip:bottom="t('finder.useLocationHint')"
              :variant="source === 'gps' ? 'flat' : 'tonal'"
              :loading="locating"
              prepend-icon="mdi-crosshairs-gps"
              data-testid="finder-gps"
              @click="useMyLocation"
            >
              <span class="d-none d-sm-inline">{{ t('finder.useLocation') }}</span>
            </v-btn>
          </template>
        </v-autocomplete>
      </v-col>
      <v-col
        cols="6"
        md="2"
      >
        <v-select
          :model-value="radiusKm"
          :items="radiusOptions"
          :label="t('finder.radiusLabel')"
          :disabled="!origin"
          prepend-inner-icon="mdi-radius-outline"
          hide-details
          data-testid="finder-radius"
          @update:model-value="locationStore.setRadius"
        />
      </v-col>
      <v-col
        cols="6"
        md="5"
        class="d-flex justify-md-end"
      >
        <v-btn-toggle
          v-model="sort"
          mandatory
          variant="outlined"
          density="comfortable"
          rounded="pill"
          color="primary"
          divided
          data-testid="finder-sort"
        >
          <v-btn
            v-tooltip:bottom="origin ? null : t('finder.distanceNeedsLocation')"
            value="distance"
            :disabled="!origin"
            prepend-icon="mdi-map-marker-distance"
          >
            <span class="d-none d-lg-inline">{{ t('finder.sort.distance') }}</span>
          </v-btn>
          <v-btn
            value="rating"
            prepend-icon="mdi-star"
          >
            <span class="d-none d-lg-inline">{{ t('finder.sort.rating') }}</span>
          </v-btn>
          <v-btn
            value="reviews"
            prepend-icon="mdi-comment-text-multiple-outline"
          >
            <span class="d-none d-lg-inline">{{ t('finder.sort.reviews') }}</span>
          </v-btn>
        </v-btn-toggle>
      </v-col>
      <slot name="filters" />
    </v-row>
  </v-card>

  <v-row>
    <v-col
      cols="12"
      md="5"
      class="order-2 order-md-1"
    >
      <div class="d-flex align-center mb-2 px-1">
        <span
          class="text-title-small text-medium-emphasis"
          data-testid="finder-count"
        >{{ t('finder.found', { count: ranked.length }) }}</span>
      </div>

      <v-sheet
        color="transparent"
        :max-height="mapHeight"
        class="overflow-y-auto pr-1"
      >
        <div
          v-if="loading && !ranked.length"
          class="d-flex flex-column ga-3"
        >
          <v-skeleton-loader
            v-for="n in 3"
            :key="n"
            type="list-item-avatar-three-line"
          />
        </div>

        <v-empty-state
          v-else-if="!ranked.length"
          icon="mdi-map-search-outline"
          :title="origin && hiddenByRadius ? t('finder.noneInRadius') : t('finder.none')"
          :text="origin && hiddenByRadius ? t('finder.noneInRadiusText', { count: hiddenByRadius }) : ''"
          data-testid="finder-empty"
        >
          <template
            v-if="origin && hiddenByRadius"
            #actions
          >
            <v-btn
              variant="tonal"
              @click="locationStore.setRadius(null)"
            >
              {{ t('finder.anywhere') }}
            </v-btn>
          </template>
        </v-empty-state>

        <v-card
          v-for="item in ranked"
          :id="`finder-${item.workshop.reference.replace('/', '-')}`"
          :key="item.workshop.reference"
          :variant="item.workshop.reference === selectedRef ? 'flat' : focused === item.workshop.reference ? 'tonal' : 'outlined'"
          :color="item.workshop.reference === selectedRef ? 'primary' : focused === item.workshop.reference ? 'primary' : undefined"
          class="mb-3"
          hover
          data-testid="finder-item"
          @mouseenter="highlighted = item.workshop.reference"
          @mouseleave="highlighted = null"
          @click="pick(item)"
        >
          <v-card-item>
            <template #prepend>
              <v-avatar
                color="primary"
                variant="tonal"
                size="44"
              >
                <v-icon icon="mdi-garage" />
              </v-avatar>
            </template>
            <v-card-title class="text-title-medium font-weight-bold text-wrap">
              {{ item.workshop.name }}
            </v-card-title>
            <v-card-subtitle class="text-wrap">
              {{ citiesJsonStore.getCityName(item.workshop.city) }}, {{ item.workshop.address }}
            </v-card-subtitle>
            <template #append>
              <div class="d-flex flex-column align-end ga-1">
                <v-chip
                  v-if="item.distance !== null"
                  v-tooltip:left="item.approximate ? t('finder.approximate') : null"
                  size="small"
                  variant="flat"
                  color="surface-variant"
                  prepend-icon="mdi-map-marker-distance"
                  data-testid="finder-distance"
                >
                  {{ item.approximate ? '~' : '' }}{{ formatDistance(item.distance, locale) }}
                </v-chip>
                <v-chip
                  v-if="item.rating.count"
                  size="small"
                  variant="tonal"
                  color="amber"
                  prepend-icon="mdi-star"
                >
                  {{ item.rating.average.toFixed(1) }} · {{ item.rating.count }}
                </v-chip>
                <span
                  v-else
                  class="text-body-small text-medium-emphasis"
                >{{ t('workshopsPage.noReviews') }}</span>
              </div>
            </template>
          </v-card-item>
          <slot
            name="item"
            :item="item"
          />
        </v-card>
      </v-sheet>
    </v-col>

    <v-col
      cols="12"
      md="7"
      class="order-1 order-md-2"
    >
      <workshop-map
        :markers="markers"
        :selected-id="selectedRef ?? focused"
        :highlighted-id="highlighted"
        :origin="origin"
        :radius-km="origin ? radiusKm : null"
        :height="mapHeight"
        @select="focus"
      />
    </v-col>
  </v-row>
</template>

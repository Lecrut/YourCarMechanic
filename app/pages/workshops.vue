<script setup lang="ts">
import PageHeader from '~/components/pageHeader.vue'
import AppFooter from '~/components/appFooter.vue'
import WorkshopFinder from '~/components/workshopFinder.vue'
import { pricingService, reviewsService, workshopsService } from '~/services'
import { type IWorkshop, servicesBrand } from '~/models/workshop'
import { CAR_SEGMENTS, formatDurationRange, formatRange, type IPriceListItem, itemEstimate } from '~/models/priceList'
import { type IPromotion, isPromotionActive } from '~/models/promotion'
import { type IRatingSummary, ratingSummary } from '~/models/review'

const { t } = useI18n()

const authStore = useAuthStore()
const citiesJsonStore = useCitiesJsonStore()
const carsJsonStore = useCarsJsonStore()
const servicesStore = useServicesStore()
const sharedStore = useSharedStore()
const { loading } = storeToRefs(sharedStore)

const workshops = ref<IWorkshop[]>([])
const ratings = ref<Record<string, IRatingSummary>>({})

const serviceFilter = ref<string | null>(null)
const brandFilter = ref<string | null>(null)
const search = ref<string | null>('')

const pricingDialog = ref(false)
const selectedWorkshop = ref<IWorkshop | null>(null)
const priceItems = ref<IPriceListItem[]>([])
const promotions = ref<IPromotion[]>([])
const loadingPricing = ref(false)

const brandOptions = computed(() => carsJsonStore.carsFromJson.map(c => c.brand))

const filtered = computed(() => {
  const q = search.value?.trim().toLowerCase() ?? ''
  return workshops.value.filter((w) => {
    if (serviceFilter.value && !w.services.includes(serviceFilter.value)) return false
    if (brandFilter.value && !servicesBrand(w, brandFilter.value)) return false
    if (!q) return true
    const cityName = citiesJsonStore.getCityName(w.city).toLowerCase()
    return `${w.name} ${w.address} ${cityName}`.toLowerCase().includes(q)
  })
})

const activePromotions = computed(() => promotions.value.filter(p => isPromotionActive(p)))
/** Customers book straight away (the workshop is preselected); guests sign in first and come back. */
const isGuest = computed(() => !authStore.user)
const canBook = computed(() => isGuest.value || authStore.user?.role === 'user')
function bookPath(workshop: IWorkshop) {
  const target = `/user?workshop=${encodeURIComponent(workshop.reference)}`
  return isGuest.value ? `/auth/login?redirect=${encodeURIComponent(target)}` : target
}

const priceHeaders = computed(() => [
  { title: t('pricing.service'), key: 'serviceKey', value: (i: IPriceListItem) => servicesStore.label(i.serviceKey) },
  { title: t('pricing.itemName'), key: 'name' },
  { title: t('pricing.laborHours'), key: 'laborHours', sortable: false },
  ...CAR_SEGMENTS.map(s => ({ title: t(`pricing.segments.${s}`), key: s, sortable: false })),
])

async function loadWorkshops() {
  const list = await sharedStore.run(() => workshopsService.getApprovedWorkshops())
  if (!list) return
  workshops.value = list
  if (!list.length) return
  try {
    const allReviews = await reviewsService.getReviewsForWorkshops(list.map(w => w.reference))
    const byCompany: Record<string, IRatingSummary> = {}
    for (const w of list) {
      const summary = ratingSummary(allReviews.filter(r => r.companyRef === w.reference))
      if (summary) byCompany[w.reference] = summary
    }
    ratings.value = byCompany
  }
  catch (e) {
    console.error(e)
  }
}

async function openPricing(workshop: IWorkshop) {
  selectedWorkshop.value = workshop
  pricingDialog.value = true
  loadingPricing.value = true
  priceItems.value = []
  promotions.value = []
  try {
    const [items, promos] = await Promise.all([
      pricingService.getPriceList(workshop.reference),
      pricingService.getPromotions(workshop.reference),
    ])
    priceItems.value = items
    promotions.value = promos
  }
  catch (e) {
    sharedStore.fail(e)
  }
  finally {
    loadingPricing.value = false
  }
}

onMounted(() => {
  carsJsonStore.getCarsFromJson()
  loadWorkshops()
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <v-container class="py-8 flex-grow-1">
      <page-header
        :title="t('workshopsPage.title')"
        :subtitle="t('workshopsPage.subtitle')"
        icon="mdi-garage"
      />

      <workshop-finder
        :workshops="filtered"
        :ratings="ratings"
        :loading="loading"
      >
        <template #filters>
          <v-col
            cols="12"
            md="4"
          >
            <v-autocomplete
              v-model="serviceFilter"
              :items="servicesStore.options"
              :label="t('workshopsPage.service')"
              prepend-inner-icon="mdi-tools"
              clearable
              hide-details
              data-testid="public-service-filter"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-autocomplete
              v-model="brandFilter"
              :items="brandOptions"
              :label="t('workshopsPage.brand')"
              prepend-inner-icon="mdi-car-info"
              clearable
              hide-details
              data-testid="public-brand-filter"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-text-field
              v-model="search"
              :label="t('workshopsPage.search')"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              data-testid="public-workshop-search"
            />
          </v-col>
        </template>

        <template #item="{ item }">
          <v-card-text class="pt-0">
            <div class="d-flex flex-wrap align-center ga-3 mb-2 text-body-medium">
              <span class="d-flex align-center ga-1">
                <v-icon
                  icon="mdi-clock-outline"
                  size="small"
                  color="primary"
                />
                {{ item.workshop.openingTime }}:00 – {{ item.workshop.closingTime }}:00
              </span>
              <a
                v-if="item.workshop.phone"
                :href="`tel:${item.workshop.phone}`"
                class="d-flex align-center ga-1 text-primary text-decoration-none"
                @click.stop
              >
                <v-icon
                  icon="mdi-phone-outline"
                  size="small"
                />
                {{ item.workshop.phone }}
              </a>
            </div>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="key in item.workshop.services.slice(0, 4)"
                :key="key"
                size="x-small"
                variant="tonal"
              >
                {{ servicesStore.label(key) }}
              </v-chip>
              <v-chip
                v-if="item.workshop.services.length > 4"
                size="x-small"
                variant="text"
              >
                +{{ item.workshop.services.length - 4 }}
              </v-chip>
            </div>
            <div
              class="d-flex align-center ga-1 text-body-small text-medium-emphasis mt-2"
              data-testid="workshop-brands"
            >
              <v-icon
                icon="mdi-car-multiple"
                size="small"
              />
              {{ item.workshop.brands.length ? item.workshop.brands.join(', ') : t('workshopsPage.allBrands') }}
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-3 pt-0 ga-2 flex-wrap">
            <v-btn
              variant="tonal"
              size="small"
              prepend-icon="mdi-cash-multiple"
              data-testid="open-workshop-pricing"
              @click.stop="openPricing(item.workshop)"
            >
              {{ t('workshopsPage.viewPricing') }}
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="canBook"
              :to="bookPath(item.workshop)"
              size="small"
              variant="flat"
              color="primary"
              prepend-icon="mdi-calendar-check"
              @click.stop
            >
              {{ isGuest ? t('workshopsPage.bookLogin') : t('workshopsPage.bookNow') }}
            </v-btn>
          </v-card-actions>
        </template>
      </workshop-finder>
    </v-container>

    <v-dialog
      v-model="pricingDialog"
      max-width="920"
      scrollable
    >
      <v-card
        v-if="selectedWorkshop"
        :title="selectedWorkshop.name"
        :subtitle="`${citiesJsonStore.getCityName(selectedWorkshop.city)} · ${selectedWorkshop.address}`"
        prepend-icon="mdi-cash-multiple"
      >
        <v-card-text>
          <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <v-chip
              v-if="selectedWorkshop.hourlyRate"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-account-wrench"
            >
              {{ t('workshopsPage.hourlyRate', { rate: selectedWorkshop.hourlyRate }) }}
            </v-chip>
            <v-chip
              v-for="promo in activePromotions"
              :key="promo.reference"
              color="success"
              variant="tonal"
              prepend-icon="mdi-tag-outline"
            >
              {{ promo.title }} (-{{ promo.percent }}%)
            </v-chip>
          </div>

          <v-progress-linear
            v-if="loadingPricing"
            indeterminate
            color="primary"
            class="mb-4"
          />

          <v-empty-state
            v-else-if="!priceItems.length"
            icon="mdi-cash-off"
            :title="t('workshopsPage.noPricing')"
          />

          <v-data-table
            v-else
            :headers="priceHeaders"
            :items="priceItems"
            item-value="reference"
            density="comfortable"
          >
            <template #[`item.laborHours`]="{ item }">
              {{ formatDurationRange(item.laborHours) }}
            </template>
            <template
              v-for="seg in CAR_SEGMENTS"
              :key="seg"
              #[`item.${seg}`]="{ item }"
            >
              {{ formatRange(itemEstimate(item, selectedWorkshop.hourlyRate, seg)) }}
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            color="default"
            @click="pricingDialog = false"
          >
            {{ t('universal.close') }}
          </v-btn>
          <v-btn
            v-if="canBook"
            :to="bookPath(selectedWorkshop)"
            prepend-icon="mdi-calendar-check"
          >
            {{ isGuest ? t('workshopsPage.bookLogin') : t('workshopsPage.bookNow') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <app-footer />
  </div>
</template>

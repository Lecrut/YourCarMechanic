<script setup lang="ts">
import PageHeader from '~/components/pageHeader.vue'
import AppFooter from '~/components/appFooter.vue'
import { pricingService, reviewsService, workshopsService } from '~/services'
import type { IWorkshop } from '~/models/workshop'
import { CAR_SEGMENTS, formatDuration, formatRange, type IPriceListItem, itemEstimate } from '~/models/priceList'
import { type IPromotion, isPromotionActive } from '~/models/promotion'
import { type IRatingSummary, ratingSummary } from '~/models/review'

const { t } = useI18n()

const authStore = useAuthStore()
const citiesJsonStore = useCitiesJsonStore()
const servicesStore = useServicesStore()
const sharedStore = useSharedStore()
const { loading } = storeToRefs(sharedStore)

const workshops = ref<IWorkshop[]>([])
const ratings = ref<Map<string, IRatingSummary>>(new Map())

const cityFilter = ref<string | null>(null)
const serviceFilter = ref<string | null>(null)
const search = ref('')

const pricingDialog = ref(false)
const selectedWorkshop = ref<IWorkshop | null>(null)
const priceItems = ref<IPriceListItem[]>([])
const promotions = ref<IPromotion[]>([])
const loadingPricing = ref(false)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return workshops.value.filter((w) => {
    if (cityFilter.value && w.city !== cityFilter.value) return false
    if (serviceFilter.value && !w.services.includes(serviceFilter.value)) return false
    if (!q) return true
    const cityName = citiesJsonStore.getCityName(w.city).toLowerCase()
    return `${w.name} ${w.address} ${cityName}`.toLowerCase().includes(q)
  })
})

const activePromotions = computed(() => promotions.value.filter(p => isPromotionActive(p)))

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
    const byCompany = new Map<string, IRatingSummary>()
    for (const w of list) {
      const summary = ratingSummary(allReviews.filter(r => r.companyRef === w.reference))
      if (summary) byCompany.set(w.reference, summary)
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
  citiesJsonStore.getCitiesFromJson()
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

      <v-row class="mb-6 align-center">
        <v-col
          cols="12"
          md="4"
        >
          <v-autocomplete
            v-model="cityFilter"
            :items="citiesJsonStore.citiesFromJson"
            :label="t('workshopsPage.city')"
            prepend-inner-icon="mdi-city"
            clearable
            hide-details
            data-testid="public-city-filter"
          />
        </v-col>
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
          <v-text-field
            v-model="search"
            :label="t('workshopsPage.search')"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            data-testid="public-workshop-search"
          />
        </v-col>
      </v-row>

      <v-row v-if="loading && !workshops.length">
        <v-col
          v-for="n in 3"
          :key="n"
          cols="12"
          md="6"
          lg="4"
        >
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <v-empty-state
        v-else-if="!filtered.length"
        icon="mdi-garage-alert"
        :title="t('workshopsPage.empty')"
      />

      <v-row v-else>
        <v-col
          v-for="workshop in filtered"
          :key="workshop.reference"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="h-100 d-flex flex-column pa-2"
            elevation="2"
            data-testid="public-workshop-card"
          >
            <v-card-item
              :title="workshop.name"
              :subtitle="`${citiesJsonStore.getCityName(workshop.city)} · ${workshop.address}`"
              prepend-icon="mdi-garage"
            >
              <template #append>
                <v-chip
                  v-if="ratings.get(workshop.reference)"
                  size="small"
                  color="amber"
                  variant="tonal"
                  prepend-icon="mdi-star"
                >
                  {{ ratings.get(workshop.reference)!.average }} ({{ ratings.get(workshop.reference)!.count }})
                </v-chip>
                <span
                  v-else
                  class="text-caption text-medium-emphasis"
                >
                  {{ t('workshopsPage.noReviews') }}
                </span>
              </template>
            </v-card-item>

            <v-card-text class="flex-grow-1">
              <div class="d-flex flex-column ga-2 mb-4 text-body-medium">
                <div class="d-flex align-center ga-2">
                  <v-icon
                    icon="mdi-clock-outline"
                    size="small"
                    color="primary"
                  />
                  <span>{{ workshop.openingTime }}:00 – {{ workshop.closingTime }}:00</span>
                </div>
                <div
                  v-if="workshop.phone"
                  class="d-flex align-center ga-2"
                >
                  <v-icon
                    icon="mdi-phone-outline"
                    size="small"
                    color="primary"
                  />
                  <a
                    :href="`tel:${workshop.phone}`"
                    class="text-primary text-decoration-none"
                  >{{ workshop.phone }}</a>
                </div>
              </div>

              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="key in workshop.services.slice(0, 6)"
                  :key="key"
                  size="small"
                  variant="tonal"
                >
                  {{ servicesStore.label(key) }}
                </v-chip>
                <v-chip
                  v-if="workshop.services.length > 6"
                  size="small"
                  variant="text"
                >
                  +{{ workshop.services.length - 6 }}
                </v-chip>
              </div>
            </v-card-text>

            <v-card-actions class="px-4 pb-4 ga-2 flex-wrap">
              <v-btn
                variant="tonal"
                prepend-icon="mdi-cash-multiple"
                data-testid="open-workshop-pricing"
                @click="openPricing(workshop)"
              >
                {{ t('workshopsPage.viewPricing') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :to="authStore.user?.role === 'user' ? '/user' : '/auth/login'"
                prepend-icon="mdi-calendar-check"
              >
                {{ authStore.user?.role === 'user' ? t('workshopsPage.bookNow') : t('workshopsPage.bookLogin') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
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
              {{ formatDuration(item.laborHours.min) }} – {{ formatDuration(item.laborHours.max) }}
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
            :to="authStore.user?.role === 'user' ? '/user' : '/auth/login'"
            prepend-icon="mdi-calendar-check"
          >
            {{ authStore.user?.role === 'user' ? t('workshopsPage.bookNow') : t('workshopsPage.bookLogin') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <app-footer />
  </div>
</template>

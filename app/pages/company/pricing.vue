<script setup lang="ts">
import { CAR_SEGMENTS, formatRange, type IPriceListItem, itemEstimate } from '~/models/priceList'
import { mapIWorkshop } from '~/models/workshop'
import PageHeader from '~/components/pageHeader.vue'
import PriceItemDialog from '~/components/company/priceItemDialog.vue'

definePageMeta({ middleware: ['auth'], role: 'workshop' })

const { t } = useI18n()

const authStore = useAuthStore()
const { company } = storeToRefs(authStore)
const pricingStore = usePricingStore()
const { items } = storeToRefs(pricingStore)
const servicesStore = useServicesStore()
const { loading, error } = storeToRefs(useSharedStore())

const hourlyRate = ref(company.value?.hourlyRate ?? 0)
const editing = ref<IPriceListItem | null>(null)
const showDialog = ref(false)
const saved = ref(false)

const rateChanged = computed(() => hourlyRate.value !== (company.value?.hourlyRate ?? 0))
const servicesWithoutPrices = computed(() =>
  (company.value?.services ?? []).filter(s => !items.value.some(i => i.serviceKey === s)),
)

const headers = computed(() => [
  { title: t('pricing.service'), key: 'serviceKey', value: (i: IPriceListItem) => servicesStore.label(i.serviceKey) },
  { title: t('pricing.itemName'), key: 'name' },
  { title: t('pricing.laborHours'), key: 'laborHours', sortable: false },
  ...CAR_SEGMENTS.map(s => ({ title: t(`pricing.segments.${s}`), key: s, sortable: false })),
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

async function saveRate() {
  if (!company.value) return
  await authStore.updateCompany(mapIWorkshop({ ...company.value, hourlyRate: Number(hourlyRate.value) }))
  if (!error.value) saved.value = true
}

function openDialog(item: IPriceListItem | null) {
  editing.value = item
  showDialog.value = true
}

async function saveItem(item: IPriceListItem) {
  if (company.value) await pricingStore.save(company.value.reference, item)
  if (!error.value) saved.value = true
}

onMounted(() => {
  if (company.value) pricingStore.load(company.value.reference)
})
watch(company, value => (hourlyRate.value = value?.hourlyRate ?? 0))
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('pricing.title')"
        :subtitle="t('pricing.subtitle')"
        icon="mdi-cash-multiple"
      >
        <v-btn
          prepend-icon="mdi-plus"
          data-testid="add-price"
          :disabled="!company?.services.length"
          @click="openDialog(null)"
        >
          {{ t('pricing.addItem') }}
        </v-btn>
      </page-header>

      <v-row>
        <v-col
          cols="12"
          md="4"
        >
          <v-card
            class="pa-6 h-100"
            elevation="2"
          >
            <div class="text-title-large font-weight-bold mb-1">
              {{ t('pricing.hourlyRate') }}
            </div>
            <p class="text-body-medium text-medium-emphasis mb-4">
              {{ t('pricing.hourlyRateHint') }}
            </p>
            <v-text-field
              v-model.number="hourlyRate"
              type="number"
              min="0"
              suffix="PLN / h"
              prepend-inner-icon="mdi-account-wrench"
              data-testid="hourly-rate"
            />
            <v-btn
              block
              :disabled="!rateChanged"
              :loading="loading"
              data-testid="save-rate"
              @click="saveRate"
            >
              {{ t('universal.save') }}
            </v-btn>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="8"
        >
          <v-card
            class="pa-6 h-100"
            elevation="2"
          >
            <div class="text-title-large font-weight-bold mb-1">
              {{ t('pricing.howItWorks') }}
            </div>
            <p class="text-body-medium mb-4">
              {{ t('pricing.howItWorksText') }}
            </p>
            <v-alert
              v-if="servicesWithoutPrices.length"
              type="warning"
              variant="tonal"
              density="compact"
              :title="t('pricing.missingPrices')"
            >
              <v-chip
                v-for="key in servicesWithoutPrices"
                :key="key"
                size="small"
                class="ma-1"
              >
                {{ servicesStore.label(key) }}
              </v-chip>
            </v-alert>
            <v-alert
              v-else
              type="success"
              variant="tonal"
              density="compact"
              :text="t('pricing.allPriced')"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-card
        class="mt-6"
        elevation="2"
      >
        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          item-value="reference"
          hover
          data-testid="price-table"
        >
          <template #[`item.laborHours`]="{ item }">
            {{ item.laborHours.min }} – {{ item.laborHours.max }} h
          </template>

          <template
            v-for="segment in CAR_SEGMENTS"
            :key="segment"
            #[`item.${segment}`]="{ item }"
          >
            <span
              v-tooltip:top="t('pricing.partsTooltip', { parts: formatRange(item.partsCost[segment]) })"
              class="text-no-wrap"
            >
              {{ formatRange(itemEstimate(item, company?.hourlyRate ?? 0, segment)) }}
            </span>
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              v-tooltip="t('universal.edit')"
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              :aria-label="t('universal.edit')"
              @click="openDialog(item)"
            />
            <v-btn
              v-tooltip="t('moderator.delete')"
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              :aria-label="t('moderator.delete')"
              @click="pricingStore.remove(item)"
            />
          </template>

          <template #no-data>
            <v-empty-state
              icon="mdi-cash-remove"
              :title="t('pricing.empty')"
              :text="t('pricing.emptyText')"
            />
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <price-item-dialog
      v-model="showDialog"
      :item="editing"
      :hourly-rate="company?.hourlyRate ?? 0"
      :services="company?.services ?? []"
      @save="saveItem"
    />

    <my-snackbar
      v-model="saved"
      :is-error="false"
      :text="t('pricing.saved')"
    />
    <my-snackbar
      v-model="error"
      :is-error="true"
      :text="t('universal.error')"
    />
  </div>
</template>

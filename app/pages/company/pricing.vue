<script setup lang="ts">
import { CAR_SEGMENTS, itemEstimate } from '~/domain/priceList'
import type { IPriceListItem } from '~/types/priceList'
import { formatDurationRange, formatRange } from '~/utils/format'
import { formatDate } from '~/utils/time'
import { mapIWorkshop } from '~/mappers/workshop'
import PageHeader from '~/components/common/pageHeader.vue'
import PriceItemDialog from '~/components/company/priceItemDialog.vue'
import PromotionDialog from '~/components/company/promotionDialog.vue'
import ConfirmDialog from '~/components/common/confirmDialog.vue'
import { isPromotionActive } from '~/domain/promotion'
import type { IPromotion } from '~/types/promotion'

definePageMeta({ middleware: ['auth'], role: 'workshop' })

const { t } = useI18n()

const authStore = useAuthStore()
const { company } = storeToRefs(authStore)
const pricingStore = usePricingStore()
const { items, promotions } = storeToRefs(pricingStore)
const servicesStore = useServicesStore()
const { loading, error } = storeToRefs(useSharedStore())

const hourlyRate = ref(company.value?.hourlyRate ?? 0)
const editing = ref<IPriceListItem | null>(null)
const defaultServiceKey = ref<string | undefined>(undefined)
const showDialog = ref(false)
const saved = ref(false)
const editingPromotion = ref<IPromotion | null>(null)
const showPromotion = ref(false)
/** Pending deletion – asked for confirmation first. */
const toDelete = ref<{ kind: 'item', item: IPriceListItem } | { kind: 'promotion', item: IPromotion } | null>(null)
const confirmShown = computed({
  get: () => toDelete.value !== null,
  set: (v) => {
    if (!v) toDelete.value = null
  },
})

function deleteConfirmed() {
  const pending = toDelete.value
  if (!pending) return
  if (pending.kind === 'item') pricingStore.remove(pending.item)
  else pricingStore.removePromotion(pending.item)
}

type PromotionState = 'running' | 'planned' | 'ended'
function promotionState(p: IPromotion): PromotionState {
  if (isPromotionActive(p)) return 'running'
  return p.validFrom > new Date() ? 'planned' : 'ended'
}
const stateColor: Record<PromotionState, string> = { running: 'success', planned: 'info', ended: 'default' }
const dateOnly = (d: Date) => formatDate(d)

function openPromotion(p: IPromotion | null) {
  editingPromotion.value = p
  showPromotion.value = true
}

async function savePromotion(p: IPromotion) {
  if (company.value) await pricingStore.savePromotion(company.value.reference, p)
  if (!error.value) saved.value = true
}

const rateChanged = computed(() => hourlyRate.value !== (company.value?.hourlyRate ?? 0))
const servicesWithoutPrices = computed(() =>
  (company.value?.services ?? []).filter(s => !items.value.some(i => i.serviceKey === s)),
)

const headers = computed(() => [
  { title: t('pricing.service'), key: 'serviceKey', value: (i: IPriceListItem) => servicesStore.label(i.serviceKey) },
  { title: t('pricing.laborHours'), key: 'laborHours', sortable: false },
  ...CAR_SEGMENTS.map(s => ({ title: t(`pricing.segments.${s}`), key: s, sortable: false })),
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

async function saveRate() {
  if (!company.value) return
  await authStore.updateCompany(mapIWorkshop({ ...company.value, hourlyRate: Number(hourlyRate.value) }))
  if (!error.value) saved.value = true
}

function openDialog(item: IPriceListItem | null, serviceKey?: string) {
  editing.value = item
  defaultServiceKey.value = serviceKey
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
          md="5"
          lg="4"
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
          md="7"
          lg="8"
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
            >
              <div class="text-title-small font-weight-bold mb-2">
                {{ t('pricing.missingPrices') }}
              </div>
              <v-chip
                v-for="key in servicesWithoutPrices"
                :key="key"
                size="small"
                prepend-icon="mdi-plus"
                class="ma-1"
                @click="openDialog(null, key)"
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
          <template #[`item.serviceKey`]="{ item }">
            <div>{{ servicesStore.label(item.serviceKey) }}</div>
            <div
              v-if="item.name"
              class="text-body-small text-medium-emphasis"
            >
              {{ item.name }}
            </div>
          </template>
          <template #[`item.laborHours`]="{ item }">
            {{ formatDurationRange(item.laborHours) }}
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
            <div class="d-flex justify-end flex-nowrap">
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
                @click="toDelete = { kind: 'item', item }"
              />
            </div>
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

      <v-card
        class="mt-6"
        elevation="2"
        data-testid="promotions"
      >
        <v-card-item
          :title="t('promotions.title')"
          :subtitle="t('promotions.subtitle')"
          prepend-icon="mdi-tag-multiple-outline"
        >
          <template #append>
            <v-btn
              prepend-icon="mdi-plus"
              variant="tonal"
              :disabled="!company?.services.length"
              data-testid="add-promotion"
              @click="openPromotion(null)"
            >
              {{ t('promotions.add') }}
            </v-btn>
          </template>
        </v-card-item>
        <v-divider />
        <v-list
          v-if="promotions.length"
          lines="two"
        >
          <v-list-item
            v-for="p in promotions"
            :key="p.reference"
            :title="`${p.title} · −${p.percent}%`"
            :subtitle="`${dateOnly(p.validFrom)} – ${dateOnly(p.validTo)} · ${p.services.map(servicesStore.label).join(', ')}`"
          >
            <template #prepend>
              <v-avatar
                color="error"
                variant="tonal"
              >
                <v-icon icon="mdi-tag" />
              </v-avatar>
            </template>
            <template #append>
              <v-chip
                :color="stateColor[promotionState(p)]"
                size="small"
                variant="tonal"
                class="mr-2"
              >
                {{ t(`promotions.state.${promotionState(p)}`) }}
              </v-chip>
              <v-btn
                v-tooltip="t('universal.edit')"
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="primary"
                :aria-label="t('universal.edit')"
                @click="openPromotion(p)"
              />
              <v-btn
                v-tooltip="t('moderator.delete')"
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                :aria-label="t('moderator.delete')"
                @click="toDelete = { kind: 'promotion', item: p }"
              />
            </template>
          </v-list-item>
        </v-list>
        <v-empty-state
          v-else
          icon="mdi-tag-off-outline"
          :title="t('promotions.empty')"
          :text="t('promotions.emptyText')"
          size="64"
        />
      </v-card>
    </v-container>

    <confirm-dialog
      v-model="confirmShown"
      :title="toDelete?.kind === 'promotion' ? t('promotions.deleteTitle') : t('pricing.deleteTitle')"
      :text="toDelete?.kind === 'promotion' ? t('promotions.deleteText', { name: toDelete.item.title }) : t('pricing.deleteText', { name: toDelete ? (toDelete.item.name || servicesStore.label(toDelete.item.serviceKey)) : '' })"
      icon="mdi-delete-outline"
      @confirm="deleteConfirmed"
    />

    <promotion-dialog
      v-model="showPromotion"
      :promotion="editingPromotion"
      :services="company?.services ?? []"
      @save="savePromotion"
    />

    <price-item-dialog
      v-model="showDialog"
      :item="editing"
      :default-service-key="defaultServiceKey"
      :hourly-rate="company?.hourlyRate ?? 0"
      :services="company?.services ?? []"
      @save="saveItem"
    />

    <my-snackbar
      v-model="saved"
      :is-error="false"
      :text="t('pricing.saved')"
    />
  </div>
</template>

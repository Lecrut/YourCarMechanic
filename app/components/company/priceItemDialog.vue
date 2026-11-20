<script setup lang="ts">
import { CAR_SEGMENTS, itemEstimate } from '~/domain/priceList'
import { mapIPriceListItem } from '~/mappers/priceList'
import type { IPriceListItem, Range } from '~/types/priceList'
import { formatDuration, formatRange } from '~/utils/format'
import { requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'

/** Add / edit one price-list row: labor hours range + parts cost range per car segment. */
const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{
  item: IPriceListItem | null
  defaultServiceKey?: string
  hourlyRate: number
  /** Services the workshop offers – a price item must belong to one of them. */
  services: string[]
}>()

const emit = defineEmits<{ save: [item: IPriceListItem] }>()

const { t } = useI18n()
const servicesStore = useServicesStore()
const { form, valid, isValid } = formValidation()

const draft = ref<IPriceListItem>(mapIPriceListItem({}))

const serviceOptions = computed(() => servicesStore.options.filter(o => props.services.includes(o.value)))

const maxNotBelowMin = (range: Range) => () => range.max >= range.min || t('pricing.maxBelowMin')
const nonNegative = (v: number) => v >= 0 || t('pricing.nonNegative')
/** Labor time is entered in 15-minute steps. */
const quarterStep = (v: number) => Number.isInteger(Math.round(Number(v) * 1000) / 250) || t('duration.quarterStep')

watch(isDialogShown, (shown) => {
  if (shown) draft.value = mapIPriceListItem(props.item ?? { serviceKey: props.defaultServiceKey ?? '' })
})

async function save() {
  if (!(await isValid())) return
  emit('save', mapIPriceListItem(draft.value))
  isDialogShown.value = false
}
</script>

<template>
  <v-dialog
    v-model="isDialogShown"
    max-width="760"
    scrollable
  >
    <v-card
      :title="item ? t('pricing.editItem') : t('pricing.addItem')"
      prepend-icon="mdi-cash-edit"
    >
      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                v-model="draft.serviceKey"
                :items="serviceOptions"
                :label="t('pricing.service')"
                :rules="[requiredRule(t)]"
                data-testid="price-service"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="draft.name"
                :label="t('pricing.itemName')"
                :placeholder="t('pricing.itemNamePlaceholder')"
                :hint="t('pricing.itemNameHint')"
                persistent-hint
                data-testid="price-name"
              />
            </v-col>
          </v-row>

          <div class="text-title-medium mb-2 d-flex align-center ga-2">
            <v-icon
              icon="mdi-account-wrench"
              size="small"
            />
            {{ t('pricing.laborHours') }}
            <v-icon
              v-tooltip:top="t('pricing.laborHoursHint', { rate: hourlyRate })"
              icon="mdi-information-outline"
              size="small"
              color="medium-emphasis"
            />
          </div>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="draft.laborHours.min"
                type="number"
                step="0.25"
                min="0"
                suffix="h"
                :label="t('pricing.min')"
                :rules="[nonNegative, quarterStep]"
                :hint="formatDuration(draft.laborHours.min)"
                persistent-hint
                data-testid="labor-min"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="draft.laborHours.max"
                type="number"
                step="0.25"
                min="0"
                suffix="h"
                :label="t('pricing.max')"
                :rules="[nonNegative, quarterStep, maxNotBelowMin(draft.laborHours)]"
                :hint="formatDuration(draft.laborHours.max)"
                persistent-hint
                data-testid="labor-max"
              />
            </v-col>
          </v-row>

          <div class="text-title-medium mb-2 d-flex align-center ga-2">
            <v-icon
              icon="mdi-cog-outline"
              size="small"
            />
            {{ t('pricing.partsCost') }}
            <v-icon
              v-tooltip:top="t('pricing.segmentHint')"
              icon="mdi-information-outline"
              size="small"
              color="medium-emphasis"
            />
          </div>
          <v-row
            v-for="segment in CAR_SEGMENTS"
            :key="segment"
            class="align-center"
          >
            <v-col
              cols="12"
              md="3"
            >
              <v-chip
                variant="tonal"
                :color="segment === 'premium' ? 'amber' : segment === 'economy' ? 'success' : 'primary'"
              >
                {{ t(`pricing.segments.${segment}`) }}
              </v-chip>
            </v-col>
            <v-col
              cols="6"
              md="3"
            >
              <v-text-field
                v-model.number="draft.partsCost[segment].min"
                type="number"
                min="0"
                suffix="PLN"
                :label="t('pricing.min')"
                :rules="[nonNegative]"
                hide-details="auto"
              />
            </v-col>
            <v-col
              cols="6"
              md="3"
            >
              <v-text-field
                v-model.number="draft.partsCost[segment].max"
                type="number"
                min="0"
                suffix="PLN"
                :label="t('pricing.max')"
                :rules="[nonNegative, maxNotBelowMin(draft.partsCost[segment])]"
                hide-details="auto"
              />
            </v-col>
            <v-col
              cols="12"
              md="3"
              class="text-body-medium text-medium-emphasis"
            >
              = {{ formatRange(itemEstimate(draft, hourlyRate, segment)) }}
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="isDialogShown = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          data-testid="save-price"
          @click="save"
        >
          {{ t('universal.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { IFix } from '~/models/fix'
import { carSegment, formatRange, isWithin, quoteLineTotal, type Range } from '~/models/priceList'
import { mapINotification } from '~/models/notification'

/**
 * Itemised quote: lines come from the workshop's price list for the repair's services
 * (pre-filled with mid-range values) plus optional custom lines. The total must fit the
 * estimate the client saw when booking.
 */
const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{ fix: IFix }>()

interface Line {
  name: string
  laborHours: number
  partsCost: number
  include: boolean
  /** Ranges from the price list; null for custom lines. */
  hoursRange: Range | null
  partsRange: Range | null
}

const { t } = useI18n()
const authStore = useAuthStore()
const pricingStore = usePricingStore()
const fixesStore = useFixesStore()
const servicesStore = useServicesStore()
const { loading, error } = storeToRefs(useSharedStore())

const lines = ref<Line[]>([])
const description = ref('')

const rate = computed(() => authStore.company?.hourlyRate ?? 0)
const segment = computed(() => carSegment(props.fix.car.manufacturer))
const lineTotal = (l: Line) => quoteLineTotal(l.laborHours, l.partsCost, rate.value)
const total = computed(() => lines.value.filter(l => l.include).reduce((sum, l) => sum + lineTotal(l), 0))
const fitsEstimate = computed(() => !props.fix.estimate || isWithin(total.value, props.fix.estimate))
const mid = (r: Range) => Math.round(((r.min + r.max) / 2) * 10) / 10

const outOfRange = (value: number, range: Range | null) => Boolean(range) && !isWithin(Number(value), range!)

function fillFromPriceList() {
  lines.value = pricingStore.items
    .filter(i => props.fix.services.includes(i.serviceKey))
    .map(i => ({
      name: i.name || servicesStore.label(i.serviceKey),
      laborHours: mid(i.laborHours),
      partsCost: Math.round(mid(i.partsCost[segment.value])),
      include: true,
      hoursRange: i.laborHours,
      partsRange: i.partsCost[segment.value],
    }))
}

function addCustomLine() {
  lines.value.push({ name: '', laborHours: 0, partsCost: 0, include: true, hoursRange: null, partsRange: null })
}

watch(isDialogShown, async (shown) => {
  if (!shown) return
  description.value = ''
  if (authStore.company && !pricingStore.items.length) await pricingStore.load(authStore.company.reference)
  fillFromPriceList()
  if (!lines.value.length) addCustomLine()
})

async function submit() {
  const items = lines.value
    .filter(l => l.include && (l.name.trim() || lineTotal(l) > 0))
    .map(l => ({ name: l.name.trim() || t('quote.customLine'), laborHours: l.laborHours, partsCost: l.partsCost, total: lineTotal(l) }))
  await fixesStore.addNotification(props.fix, mapINotification({
    notificationType: 'addQuote',
    cost: total.value,
    items,
    description: description.value,
  }))
  if (!error.value) isDialogShown.value = false
}
</script>

<template>
  <v-dialog
    v-model="isDialogShown"
    max-width="960"
    scrollable
  >
    <v-card
      :title="t('quote.title')"
      :subtitle="`${fix.car.manufacturer} ${fix.car.model} · ${t('pricing.segments.' + segment)} · ${rate} PLN/h`"
      prepend-icon="mdi-file-document-edit-outline"
    >
      <v-card-text>
        <v-table
          density="comfortable"
          data-testid="quote-lines"
        >
          <thead>
            <tr>
              <th />
              <th>{{ t('pricing.itemName') }}</th>
              <th>{{ t('pricing.laborHours') }}</th>
              <th>{{ t('quote.parts') }}</th>
              <th class="text-end">
                {{ t('quote.lineTotal') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(line, index) in lines"
              :key="index"
              :class="{ 'text-disabled': !line.include }"
            >
              <td>
                <v-checkbox-btn
                  v-model="line.include"
                  :aria-label="t('quote.include')"
                />
              </td>
              <td class="py-2">
                <v-text-field
                  v-model="line.name"
                  density="compact"
                  hide-details
                  :readonly="Boolean(line.hoursRange)"
                  :placeholder="t('quote.customLine')"
                  :data-testid="`quote-name-${index}`"
                />
              </td>
              <td class="py-2">
                <v-text-field
                  v-model.number="line.laborHours"
                  v-tooltip:top="line.hoursRange ? t('quote.allowed', { range: `${line.hoursRange.min}–${line.hoursRange.max} h` }) : null"
                  type="number"
                  step="0.5"
                  min="0"
                  suffix="h"
                  density="compact"
                  hide-details
                  :error="outOfRange(line.laborHours, line.hoursRange)"
                  :data-testid="`quote-hours-${index}`"
                />
              </td>
              <td class="py-2">
                <v-text-field
                  v-model.number="line.partsCost"
                  v-tooltip:top="line.partsRange ? t('quote.allowed', { range: formatRange(line.partsRange) }) : null"
                  type="number"
                  min="0"
                  suffix="PLN"
                  density="compact"
                  hide-details
                  :error="outOfRange(line.partsCost, line.partsRange)"
                  :data-testid="`quote-parts-${index}`"
                />
              </td>
              <td class="text-end font-weight-bold text-no-wrap">
                {{ lineTotal(line) }} PLN
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-plus"
                  data-testid="quote-add-line"
                  @click="addCustomLine"
                >
                  {{ t('quote.addLine') }}
                </v-btn>
              </td>
              <td class="text-end">
                <div
                  class="text-title-large font-weight-bold"
                  :class="fitsEstimate ? 'text-success' : 'text-error'"
                  data-testid="quote-total"
                >
                  {{ total }} PLN
                </div>
                <div
                  v-if="fix.estimate"
                  class="text-body-small text-medium-emphasis"
                >
                  {{ t('pricing.allowedRange', { range: formatRange(fix.estimate) }) }}
                </div>
              </td>
            </tr>
          </tfoot>
        </v-table>

        <v-alert
          v-if="!fitsEstimate"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
          :text="t('quote.outOfEstimate')"
          data-testid="quote-out-of-range"
        />

        <v-textarea
          v-model="description"
          class="mt-4"
          :label="t('quote.comment')"
          rows="2"
          auto-grow
        />
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
          :disabled="!fitsEstimate || total <= 0"
          :loading="loading"
          data-testid="send-quote"
          @click="submit"
        >
          {{ t('quote.send') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

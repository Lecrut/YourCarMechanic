<script setup lang="ts">
import type { IClient } from '~/models/client'
import { mapIFix } from '~/models/fix'
import { slotProblem } from '~/models/workshop'
import { estimateDuration, formatDuration, formatRange, TIME_STEP_HOURS } from '~/models/priceList'
import { requiredArrayRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'
import { fromLocalInput } from '~/utils/time'

/** Workshop books a visit on behalf of a returning client. The client must confirm it. */
const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{ client: IClient | null }>()

const { t } = useI18n()
const fixesStore = useFixesStore()
const pricingStore = usePricingStore()
const servicesStore = useServicesStore()
const authStore = useAuthStore()
const { loading, error } = storeToRefs(useSharedStore())
const { form, valid, isValid } = formValidation()

const carIndex = ref<number | null>(null)
const services = ref<string[]>([])
const description = ref('')
const date = ref('')
const mileage = ref<number | null>(null)
const duration = ref(1)
/** 15 min … 16 h in quarter-hour steps. */
const durationOptions = Array.from({ length: 64 }, (_, i) => (i + 1) * TIME_STEP_HOURS).map(value => ({ value, title: formatDuration(value) }))

// Suggest the length from the price list whenever the services change.
watch(services, value => (duration.value = estimateDuration(pricingStore.items, value)))

const carOptions = computed(() => (props.client?.cars ?? []).map((car, i) => ({
  title: `${car.manufacturer} ${car.model} ${car.productionYear}`,
  value: i,
})))
const car = computed(() => (carIndex.value == null ? null : props.client?.cars[carIndex.value] ?? null))
const estimate = computed(() => (car.value ? pricingStore.estimate(services.value, car.value.manufacturer) : null))

/** The same slots customers can pick: future full hour on a working day within opening hours. */
const validSlot = (value: string) => {
  const company = authStore.company
  if (!value || !company) return true
  const problem = slotProblem(company, fromLocalInput(value))
  return problem ? t(problem, { from: company.openingTime, to: company.closingTime }) : true
}

watch(isDialogShown, (shown) => {
  if (!shown) return
  carIndex.value = props.client?.cars.length === 1 ? 0 : null
  services.value = []
  description.value = ''
  date.value = ''
  mileage.value = null
  if (authStore.company && !pricingStore.items.length) pricingStore.load(authStore.company.reference)
})

async function submit() {
  // Validate first so the user always sees what is missing.
  if (!(await isValid()) || !props.client || !car.value || !authStore.company) return
  await fixesStore.addFix(mapIFix({
    date: fromLocalInput(date.value),
    bookDate: new Date(),
    companyRef: authStore.company.reference,
    car: car.value,
    carMillage: Number(mileage.value),
    userRef: props.client.userRef,
    services: services.value,
    description: description.value,
    clientPhone: props.client.phone,
    clientName: props.client.name,
    marketingConsent: props.client.marketingConsent,
    estimate: estimate.value,
    durationHours: duration.value,
    createdBy: 'workshop',
  }))
  if (!error.value) isDialogShown.value = false
}
</script>

<template>
  <v-dialog
    v-model="isDialogShown"
    max-width="720"
    scrollable
  >
    <v-card
      :title="t('clients.bookForClient')"
      :subtitle="client?.name || client?.phone"
      prepend-icon="mdi-calendar-plus"
    >
      <v-card-text>
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="t('clients.bookHint')"
        />
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-select
            v-model="carIndex"
            :items="carOptions"
            :label="t('userBookFix.stepper.fourth.car')"
            prepend-inner-icon="mdi-car"
            :rules="[(v: number | null) => v != null || t('rules.requiredRule')]"
            data-testid="client-car"
          />
          <v-text-field
            v-model.number="mileage"
            type="number"
            min="1"
            suffix="km"
            :label="t('userBookFix.stepper.second.mileage')"
            :rules="[requiredRule(t)]"
          />
          <v-select
            v-model="services"
            :items="servicesStore.options"
            :label="t('companyProfile.services')"
            chips
            closable-chips
            multiple
            :rules="[requiredArrayRule(t)]"
            data-testid="client-services"
          />
          <v-textarea
            v-model="description"
            :label="t('universal.description')"
            rows="2"
            auto-grow
            :rules="[requiredRule(t)]"
          />
          <v-select
            v-model="duration"
            :items="durationOptions"
            :label="t('duration.expected')"
            prepend-inner-icon="mdi-timer-outline"
            :hint="t('duration.fromPriceList')"
            persistent-hint
            class="mb-2"
            data-testid="client-duration"
          />
          <v-text-field
            v-model="date"
            type="datetime-local"
            step="3600"
            :label="t('moderator.date')"
            :rules="[requiredRule(t), validSlot]"
            data-testid="client-date"
          />
          <v-alert
            variant="tonal"
            density="compact"
            :type="estimate ? 'success' : 'info'"
            :text="estimate ? `${t('pricing.estimate')}: ${formatRange(estimate)}` : t('pricing.noEstimate')"
          />
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
          :loading="loading"
          data-testid="submit-booking"
          @click="submit"
        >
          {{ t('clients.sendBooking') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

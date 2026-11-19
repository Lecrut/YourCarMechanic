<script setup lang="ts">
import type { IFix } from '~/models/fix'
import { slotProblem } from '~/models/workshop'
import { formatRange } from '~/models/priceList'
import { requiredArrayRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'
import { fromLocalInput, toLocalInput } from '~/utils/time'

/** Workshop proposes a new scope / date for a repair. The client has to accept it. */
const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{ fix: IFix }>()

const { t } = useI18n()
const fixesStore = useFixesStore()
const pricingStore = usePricingStore()
const servicesStore = useServicesStore()
const authStore = useAuthStore()
const { loading, error } = storeToRefs(useSharedStore())
const { form, valid, isValid } = formValidation()

const services = ref<string[]>([])
const description = ref('')
const date = ref('')
const note = ref('')

/** A new date must be a valid slot; keeping the current date is always allowed. */
const validSlot = (value: string) => {
  const company = authStore.company
  if (!value || !company) return true
  const when = fromLocalInput(value)
  if (when.getTime() === props.fix.date.getTime()) return true
  const problem = slotProblem(company, when)
  return problem ? t(problem, { from: company.openingTime, to: company.closingTime }) : true
}

const estimate = computed(() => pricingStore.estimate(services.value, props.fix.car.manufacturer))

watch(isDialogShown, (shown) => {
  if (!shown) return
  services.value = [...props.fix.services]
  description.value = props.fix.description
  date.value = toLocalInput(props.fix.date)
  note.value = ''
  if (authStore.company && !pricingStore.items.length) pricingStore.load(authStore.company.reference)
})

async function submit() {
  if (!(await isValid())) return
  await fixesStore.proposeChange(props.fix, {
    services: services.value,
    description: description.value,
    date: fromLocalInput(date.value),
    estimate: estimate.value,
  }, note.value)
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
      :title="t('proposal.proposeTitle')"
      :subtitle="t('proposal.proposeHint')"
      prepend-icon="mdi-swap-horizontal"
    >
      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-select
            v-model="services"
            :items="servicesStore.options"
            :label="t('companyProfile.services')"
            chips
            closable-chips
            multiple
            :rules="[requiredArrayRule(t)]"
            data-testid="proposal-services"
          />
          <v-textarea
            v-model="description"
            :label="t('universal.description')"
            rows="2"
            auto-grow
            :rules="[requiredRule(t)]"
          />
          <v-text-field
            v-model="date"
            type="datetime-local"
            step="3600"
            :label="t('moderator.date')"
            :rules="[requiredRule(t), validSlot]"
            data-testid="proposal-date"
          />
          <v-alert
            variant="tonal"
            :type="estimate ? 'success' : 'info'"
            density="compact"
            class="mb-4"
            :text="estimate ? `${t('pricing.estimate')}: ${formatRange(estimate)}` : t('pricing.noEstimate')"
          />
          <v-textarea
            v-model="note"
            :label="t('proposal.note')"
            rows="2"
            auto-grow
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
          data-testid="send-proposal"
          @click="submit"
        >
          {{ t('proposal.send') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { mapIPromotion } from '~/mappers/promotion'
import type { IPromotion } from '~/types/promotion'
import { requiredArrayRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'

/** Add / edit a time-limited discount on some of the workshop's services. */
const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{
  promotion: IPromotion | null
  services: string[]
}>()

const emit = defineEmits<{ save: [promotion: IPromotion] }>()

const { t } = useI18n()
const servicesStore = useServicesStore()
const { form, valid, isValid } = formValidation()

const title = ref('')
const chosenServices = ref<string[]>([])
const percent = ref(10)
const from = ref('')
const to = ref('')

const serviceOptions = computed(() => servicesStore.options.filter(o => props.services.includes(o.value)))
const toDateInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const endAfterStart = () => !from.value || !to.value || to.value >= from.value || t('promotions.endBeforeStart')

watch(isDialogShown, (shown) => {
  if (!shown) return
  const p = props.promotion
  const today = new Date()
  const inAMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
  title.value = p?.title ?? ''
  chosenServices.value = [...(p?.services ?? [])]
  percent.value = p?.percent ?? 10
  from.value = toDateInput(p?.validFrom ?? today)
  to.value = toDateInput(p?.validTo ?? inAMonth)
})

async function save() {
  if (!(await isValid())) return
  emit('save', mapIPromotion({
    title: title.value.trim(),
    services: chosenServices.value,
    percent: percent.value,
    validFrom: new Date(`${from.value}T00:00:00`),
    validTo: new Date(`${to.value}T00:00:00`),
    reference: props.promotion?.reference ?? '',
  }))
  isDialogShown.value = false
}
</script>

<template>
  <v-dialog
    v-model="isDialogShown"
    max-width="620"
  >
    <v-card
      :title="promotion ? t('promotions.edit') : t('promotions.add')"
      prepend-icon="mdi-tag-outline"
    >
      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-text-field
            v-model="title"
            :label="t('promotions.name')"
            :placeholder="t('promotions.namePlaceholder')"
            :rules="[requiredRule(t)]"
            data-testid="promotion-title"
          />
          <v-autocomplete
            v-model="chosenServices"
            :items="serviceOptions"
            :label="t('companyProfile.services')"
            chips
            closable-chips
            multiple
            :rules="[requiredArrayRule(t)]"
            data-testid="promotion-services"
          />
          <div class="text-body-medium mb-1">
            {{ t('promotions.percent') }}: <strong>{{ percent }}%</strong>
          </div>
          <v-slider
            v-model="percent"
            :min="5"
            :max="50"
            :step="5"
            show-ticks="always"
            thumb-label
            color="error"
            data-testid="promotion-percent"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="from"
                type="date"
                :label="t('promotions.from')"
                :rules="[requiredRule(t)]"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="to"
                type="date"
                :label="t('promotions.to')"
                :rules="[requiredRule(t), endAfterStart]"
                data-testid="promotion-to"
              />
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
          data-testid="save-promotion"
          @click="save"
        >
          {{ t('universal.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

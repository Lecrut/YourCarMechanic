<script setup lang="ts">
import type { IWorkshop } from '~/models/workshop'
import { lengthRuleShort, phoneRule, requiredArrayRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'

/** Company data form shared by role choice, the company profile and the moderator panel. */
const workshop = defineModel<IWorkshop>({ required: true })

const props = withDefaults(defineProps<{
  readonly?: boolean
  /** NIP can only be typed when the company is created. */
  nipEditable?: boolean
  email?: string
}>(), { readonly: false, nipEditable: false, email: '' })

const { t } = useI18n()
const { form, valid, isValid } = formValidation()

const citiesJsonStore = useCitiesJsonStore()
const servicesStore = useServicesStore()

const hours = Array.from({ length: 25 }, (_, h) => ({ title: `${h}:00`, value: h }))
const closingAfterOpening = () =>
  workshop.value.closingTime > workshop.value.openingTime || t('rules.closingAfterOpening')

onMounted(() => citiesJsonStore.getCitiesFromJson())

defineExpose({ isValid })
</script>

<template>
  <v-form
    ref="form"
    v-model="valid"
    :readonly="props.readonly"
  >
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="workshop.name"
          :label="t('companyProfile.name')"
          prepend-inner-icon="mdi-domain"
          :rules="[requiredRule(t)]"
          data-testid="company-name"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="workshop.nip"
          :label="t('companyProfile.nip')"
          prepend-inner-icon="mdi-identifier"
          :readonly="!nipEditable"
          :rules="nipEditable ? [requiredRule(t), lengthRuleShort(t)] : []"
          data-testid="company-nip"
        />
      </v-col>

      <v-col
        v-if="email"
        cols="12"
        md="6"
      >
        <v-text-field
          :model-value="email"
          :label="t('companyProfile.email')"
          prepend-inner-icon="mdi-email-outline"
          readonly
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          v-model="workshop.city"
          :items="citiesJsonStore.citiesFromJson"
          :label="t('companyProfile.city')"
          prepend-inner-icon="mdi-city"
          variant="outlined"
          density="comfortable"
          :rules="[requiredRule(t)]"
          data-testid="company-city"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="workshop.address"
          :label="t('companyProfile.address')"
          prepend-inner-icon="mdi-map-marker-outline"
          :rules="[requiredRule(t)]"
          data-testid="company-address"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="workshop.phone"
          :label="t('companyProfile.phone')"
          prepend-inner-icon="mdi-phone-outline"
          :rules="[requiredRule(t), phoneRule(t)]"
          data-testid="company-phone"
        />
      </v-col>

      <v-col
        cols="6"
        md="3"
      >
        <v-select
          v-model="workshop.openingTime"
          :items="hours"
          :label="t('companyProfile.openingTime')"
          :rules="[closingAfterOpening]"
          data-testid="company-opening"
        />
      </v-col>

      <v-col
        cols="6"
        md="3"
      >
        <v-select
          v-model="workshop.closingTime"
          :items="hours"
          :label="t('companyProfile.closingTime')"
          :rules="[closingAfterOpening]"
          data-testid="company-closing"
        />
      </v-col>

      <v-col cols="12">
        <v-select
          v-model="workshop.services"
          :label="t('companyProfile.services')"
          :items="servicesStore.options"
          prepend-inner-icon="mdi-tools"
          chips
          closable-chips
          multiple
          :rules="[requiredArrayRule(t)]"
          data-testid="company-services"
        />
      </v-col>
    </v-row>
  </v-form>
</template>

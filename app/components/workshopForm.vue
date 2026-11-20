<script setup lang="ts">
import { MAX_STATIONS } from '~/domain/workshop'
import type { IWorkshop } from '~/types/workshop'
import { nipRule, phoneRule, requiredArrayRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'
import type { LatLng } from '~/types/geo'
import WorkshopMap from '~/components/map/workshopMap.vue'

/** Company data form shared by role choice, the company profile and the moderator panel. */
const workshop = defineModel<IWorkshop>({ required: true })

const props = withDefaults(defineProps<{
  readonly?: boolean
  /** NIP can only be typed when the company is created. */
  nipEditable?: boolean
  email?: string
}>(), { readonly: false, nipEditable: false, email: '' })

const { t, locale } = useI18n()
const { form, valid, isValid } = formValidation()

const citiesJsonStore = useCitiesJsonStore()
const servicesStore = useServicesStore()
const carsJsonStore = useCarsJsonStore()

const brandOptions = computed(() => carsJsonStore.carsFromJson.map(c => c.brand))
/** Where the map starts when the pin is not set yet – the chosen city. */
const cityCenter = computed(() => citiesJsonStore.getCityLocation(workshop.value.city))

function pick(position: LatLng) {
  if (props.readonly) return
  workshop.value.location = { lat: Number(position.lat.toFixed(6)), lng: Number(position.lng.toFixed(6)) }
}

const hours = Array.from({ length: 25 }, (_, h) => ({ title: `${h}:00`, value: h }))

/** Monday first; values are `Date#getDay()` numbers. Labels come from Intl, so they follow the locale. */
const weekDays = computed(() => [1, 2, 3, 4, 5, 6, 0].map(value => ({
  value,
  title: new Date(2024, 0, 7 + value).toLocaleDateString(locale.value === 'pl' ? 'pl-PL' : 'en-GB', { weekday: 'short' }),
})))
const closingAfterOpening = () =>
  workshop.value.closingTime > workshop.value.openingTime || t('rules.closingAfterOpening')

onMounted(() => {
  citiesJsonStore.getCitiesFromJson()
  carsJsonStore.getCarsFromJson()
})

/** Also requires at least one working day (chip groups are not part of v-form validation). */
async function validate() {
  return (await isValid()) && workshop.value.workingDays.length > 0
}

defineExpose({ isValid: validate })
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
          :rules="nipEditable ? [requiredRule(t), nipRule(t)] : []"
          :hint="nipEditable ? t('companyProfile.nipHint') : ''"
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

      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model.number="workshop.stations"
          v-tooltip:top="t('companyProfile.stationsHint')"
          type="number"
          min="1"
          :max="MAX_STATIONS"
          :label="t('companyProfile.stations')"
          prepend-inner-icon="mdi-garage-variant"
          :rules="[(v: number) => (v >= 1 && v <= MAX_STATIONS) || t('companyProfile.stationsRule', { max: MAX_STATIONS })]"
          data-testid="company-stations"
        />
      </v-col>

      <v-col cols="12">
        <div class="text-body-medium text-medium-emphasis mb-1 d-flex align-center ga-1">
          {{ t('companyProfile.workingDays') }}
          <v-icon
            v-tooltip:top="t('companyProfile.workingDaysHint')"
            icon="mdi-information-outline"
            size="small"
          />
        </div>
        <v-chip-group
          v-model="workshop.workingDays"
          multiple
          column
          selected-class="text-primary"
          :disabled="props.readonly"
          data-testid="company-working-days"
        >
          <v-chip
            v-for="day in weekDays"
            :key="day.value"
            :value="day.value"
            filter
            variant="tonal"
          >
            {{ day.title }}
          </v-chip>
        </v-chip-group>
        <div
          v-if="!workshop.workingDays.length"
          class="text-error text-body-small"
        >
          {{ t('rules.requiredArrayRule') }}
        </div>
      </v-col>

      <v-col cols="12">
        <v-autocomplete
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

      <v-col cols="12">
        <v-autocomplete
          v-model="workshop.brands"
          :label="t('companyProfile.brands')"
          :items="brandOptions"
          :placeholder="t('companyProfile.allBrands')"
          persistent-placeholder
          :hint="t('companyProfile.brandsHint')"
          persistent-hint
          prepend-inner-icon="mdi-car-multiple"
          chips
          closable-chips
          multiple
          clearable
          data-testid="company-brands"
        />
      </v-col>

      <v-col cols="12">
        <div class="text-body-medium text-medium-emphasis mb-2 d-flex align-center ga-1">
          {{ t('companyProfile.location') }}
          <v-icon
            v-tooltip:top="t('companyProfile.locationHint')"
            icon="mdi-information-outline"
            size="small"
          />
          <v-spacer />
          <v-btn
            v-if="workshop.location && !props.readonly"
            variant="text"
            size="small"
            prepend-icon="mdi-map-marker-remove-outline"
            data-testid="company-location-clear"
            @click="workshop.location = null"
          >
            {{ t('companyProfile.locationClear') }}
          </v-btn>
        </div>
        <workshop-map
          :pickable="!props.readonly"
          :picked="workshop.location"
          :origin="workshop.location ? null : cityCenter"
          :height="320"
          @pick="pick"
        />
        <div
          class="text-body-small text-medium-emphasis mt-1"
          data-testid="company-location-state"
        >
          {{ workshop.location ? t('companyProfile.locationSet') : t('companyProfile.locationUnset') }}
        </div>
      </v-col>
    </v-row>
  </v-form>
</template>

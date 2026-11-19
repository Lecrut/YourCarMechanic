<script setup lang="ts">
import { productionYearRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'
import { type ICar, mapICar } from '~/models/car'

const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{ car: ICar | null }>()

const { t } = useI18n()

const carsStore = useCarsStore()
const sharedStore = useSharedStore()
const { error } = storeToRefs(sharedStore)
const authStore = useAuthStore()
const carsJsonStore = useCarsJsonStore()

const { form, valid, isValid } = formValidation()

const selectedCarBrand = ref<string | null>(null)
const selectedCarModel = ref<string | null>(null)
const carYear = ref<number | null>(null)
const carVin = ref<string | null>(null)
const iKnowVin = ref(false)

const carBrands = computed(() => carsJsonStore.carsFromJson.map(car => car.brand))
const carModels = computed(() =>
  carsJsonStore.carsFromJson.find(car => car.brand === selectedCarBrand.value)?.models ?? [],
)

function resetState() {
  selectedCarBrand.value = null
  selectedCarModel.value = null
  iKnowVin.value = false
  carYear.value = null
  carVin.value = null
}

function close() {
  resetState()
  isDialogShown.value = false
}

async function saveForm() {
  if (!(await isValid())) return

  const formCar = mapICar({
    manufacturer: selectedCarBrand.value ?? '',
    model: selectedCarModel.value ?? '',
    productionYear: carYear.value ?? 1900,
    vin: iKnowVin.value ? carVin.value ?? '' : '',
    userRef: authStore.user?.reference ?? '',
    reference: props.car?.reference ?? '',
  })

  if (!props.car) await carsStore.addCar(formCar)
  else if (JSON.stringify(formCar) !== JSON.stringify(mapICar(props.car))) await carsStore.updateCar(formCar)

  if (!error.value) close()
}

watch(isDialogShown, (shown) => {
  if (!shown) return
  carsJsonStore.getCarsFromJson()
  if (props.car) {
    selectedCarBrand.value = props.car.manufacturer
    selectedCarModel.value = props.car.model
    carYear.value = props.car.productionYear
    iKnowVin.value = Boolean(props.car.vin)
    carVin.value = props.car.vin
  }
})
</script>

<template>
  <v-dialog
    max-width="800px"
    :model-value="isDialogShown"
    scrollable
    @update:model-value="close"
  >
    <v-card>
      <v-card-title>
        {{ car ? t('userProfile.form.editTitle') : t('userProfile.form.title') }}
      </v-card-title>

      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
          class="my-2 mx-4"
          @submit.prevent="saveForm"
        >
          <v-select
            v-model="selectedCarBrand"
            :label="t('userBookFix.stepper.second.carBrand')"
            :items="carBrands"
            :rules="[requiredRule(t)]"
            data-testid="car-brand"
          />

          <v-select
            v-model="selectedCarModel"
            :label="t('userBookFix.stepper.second.carModel')"
            :items="carModels"
            :rules="[requiredRule(t)]"
            data-testid="car-model"
          />

          <v-text-field
            v-model.number="carYear"
            type="number"
            min="1800"
            :max="new Date().getFullYear()"
            :label="t('userBookFix.stepper.second.productionYear')"
            :rules="[requiredRule(t), productionYearRule(t)]"
            data-testid="car-year"
          />

          <v-switch
            v-model="iKnowVin"
            :label="t('userBookFix.stepper.second.iKnowVin')"
            color="primary"
          />

          <v-text-field
            v-if="iKnowVin"
            v-model="carVin"
            :label="t('userBookFix.stepper.second.vin')"
            :rules="[requiredRule(t)]"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="default"
          @click="close"
        >
          {{ t('universal.close') }}
        </v-btn>

        <v-btn
          color="secondary"
          data-testid="save-car"
          @click="saveForm"
        >
          {{ t('universal.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <my-snackbar
    v-model="error"
    :text="t('universal.error')"
    :is-error="true"
  />
</template>

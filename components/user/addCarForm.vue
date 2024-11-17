<script setup lang="ts">
import {productionYearRule, requiredRule} from "~/helpers/rules"
import json from '../../public/cars.json'
import formValidation from "~/helpers/formValidation";
import {type ICar, mapICar} from "~/models/car";
import type {Ref} from "vue";

const isDialogShown = defineModel<boolean>()

const props = defineProps<{ car: ICar | null }>()
const {car} = toRefs(props)

const {t} = useI18n()

const carsStore = useCarsStore()

const sharedStore = useSharedStore()
const {error} = storeToRefs(sharedStore)

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const {form, valid, isValid} = formValidation()

const selectedCarBrand: Ref<string | null> = ref(null)
const selectedCarModel: Ref<string | null> = ref(null)
const carYear: Ref<number | null> = ref(null)
const carVin: Ref<string | null> = ref(null)
const iKnowVin: Ref<boolean> = ref(false)

const carBrands = computed(() => json.map(car => car.brand))
const carModels = computed(() => selectedCarBrand.value ? json.find(car => car.brand === selectedCarBrand.value)?.models || [] : [])

function resetState() {
  selectedCarBrand.value = null
  selectedCarModel.value = null
  carYear.value = null
  carVin.value = null
}

function close() {
  resetState()
  isDialogShown.value = false
}

async function saveForm() {
  if (await isValid()) {
    if (car.value) {
      await carsStore.updateCar(mapICar({
        manufacturer: selectedCarBrand.value || "",
        model: selectedCarModel.value || "",
        productionYear: carYear.value || 1900,
        vin: iKnowVin.value ? carVin.value : "",
        userRef: user.value?.reference || "",

        reference: car.value?.reference || "",
      }))
    } else {
      await carsStore.addCar(mapICar({
        manufacturer: selectedCarBrand.value || "",
        model: selectedCarModel.value || "",
        productionYear: carYear.value || 1900,
        vin: iKnowVin.value ? carVin.value : "",
        userRef: user.value?.reference || "",

        reference: "",
      }))
    }

    if (!error.value)
      close()
  }
}

watch(isDialogShown, () => {
  if (isDialogShown.value && car.value) {
    selectedCarModel.value = car.value.model
    selectedCarBrand.value = car.value.manufacturer
    carYear.value = car.value.productionYear
    iKnowVin.value = Boolean(car.value.vin)
    carVin.value = car.value.vin
  }
})
</script>

<template>
  <v-dialog
      max-width="800px"
      :model-value="isDialogShown"
      scrollable
      @update:model-value="close">
    <v-card>
      <v-card-title>
        {{ car ? t('userProfile.form.editTitle') : t('userProfile.form.title') }}
      </v-card-title>

      <v-card-text>
        <v-form
            ref="form"
            class="my-2 mx-4"
            v-model="valid"
            @submit.prevent="saveForm"
        >
          <v-select
              v-model="selectedCarBrand"
              :label="t('userBookFix.stepper.second.carBrand')"
              :items="carBrands"
              :rules="[requiredRule(t)]"
          />

          <v-select
              v-model="selectedCarModel"
              :label="t('userBookFix.stepper.second.carModel')"
              :items="carModels"
              :rules="[requiredRule(t)]"
          />

          <v-text-field
              v-model.number="carYear"
              type="number"
              min="1800"
              :max="new Date().getFullYear()"
              :label="t('userBookFix.stepper.second.productionYear')"
              :rules="[requiredRule(t), productionYearRule(t)]"
          />

          <v-switch
              v-model="iKnowVin"
              :label="t('userBookFix.stepper.second.iKnowVin')"
              color="primary"
          />

          <v-text-field
              v-if="iKnowVin"
              :label="t('userBookFix.stepper.second.vin')"
              v-model="carVin"
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
<script setup lang="ts">
import {productionYearRule, requiredRule} from "~/helpers/rules"
import json from '../../public/cars.json'
import formValidation from "~/helpers/formValidation";

const isDialogShown = defineModel<boolean>()

const {t} = useI18n()

const {form, valid, isValid} = formValidation()

const selectedCarBrand = ref(null)
const selectedCarModel = ref(null)
const carYear = ref(null)

const carBrands = computed(() => json.map(car => car.brand))
const carModels = computed(() => selectedCarBrand.value ? json.find(car => car.brand === selectedCarBrand.value)?.models || [] : [])

function resetState() {
  selectedCarBrand.value = null
  selectedCarModel.value = null
  carYear.value = null
}

function close() {
  resetState()
  isDialogShown.value = false
}

async function saveForm() {
  if (await isValid()) {

  }
}
</script>

<template>
  <v-dialog
      max-width="800px"
      :model-value="isDialogShown"
      scrollable
      @update:model-value="close">
    <v-card>
      <v-card-title>
        {{ t('userProfile.form.title') }}
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
</template>
<script setup lang="ts">
import json from '../../public/cars.json'
import type {Ref} from "vue";
import {productionYearRule, requiredRule} from "~/helpers/rules";

definePageMeta({
  layout: 'user',
})
const {t} = useI18n()

const currentStep = ref('1')
const selectedCarBrand = ref(null)
const selectedCarModel = ref(null)
const carYear = ref(null)
const carMileage = ref(null)

const cars: Ref<{ brand: string; models: string[]; }[]> = ref([])

const carBrands = computed(() => cars.value.map(car => car.brand))

const carModels = computed(() => selectedCarBrand.value ? cars.value.find(car => car.brand === selectedCarBrand.value)?.models || [] : [])

onMounted(() => {
  cars.value = json
})

</script>

<template>
  <v-container class="h-auto my-15">
    <v-row justify="center">
      <v-stepper
          v-model="currentStep"
          alt-labels
          class="stepper my-10 w-100 max-w-1000px"
          elevation="8"
      >
        <template #default="{ prev, next }">
          <v-stepper-header>
            <v-stepper-item
                :title="t('userBookFix.stepper.chooseRepair')"
                value="1"
                color="secondary"
            />

            <v-divider/>

            <v-stepper-item
                :title="t('userBookFix.stepper.chooseCar')"
                value="2" color="secondary"
            />

            <v-divider/>

            <v-stepper-item
                :title="t('userBookFix.stepper.chooseMechanic')"
                value="3"
                color="secondary"
            />
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item value="1">
              <v-form ref="credentialsForm">
                <div class="py-4" align="center">

                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="2">
              <v-form ref="infoForm">
                <div class="py-4">
                  <v-form>
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
                    <v-text-field
                        v-model.number="carMileage"
                        min="1"
                        type="number"
                        :label="t('userBookFix.stepper.second.mileage')"
                        :rules="[requiredRule(t)]"
                    />
                  </v-form>
                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="3">
              <div class="py-4">

              </div>
            </v-stepper-window-item>
          </v-stepper-window>

          <v-stepper-actions
              :next-text="t('userBookFix.stepper.nextStep')"
              :prev-text="t('userBookFix.stepper.prevStep')"
              @click:prev="prev"
              @click:next="next"
          />
        </template>
      </v-stepper>
    </v-row>

  </v-container>
</template>

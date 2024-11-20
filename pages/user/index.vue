<script setup lang="ts">
import type {Ref} from "vue";
import {productionYearRule, requiredRule} from "~/helpers/rules";
import {validateForm} from "~/helpers/formValidation";
import {services} from "~/composable/services";
import type {ICar} from "~/models/car";

definePageMeta({
  layout: 'user',
})
const {t} = useI18n()

const carsStore = useCarsStore()
const {cars} = storeToRefs(carsStore)

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const carsJsonStore = useCarsJsonStore()
const {carsFromJson} = storeToRefs(carsJsonStore)

const currentStep = ref('1')
const selectedCar: Ref<ICar | null> = ref(null)
const selectedCarBrand = ref(null)
const selectedCarModel = ref(null)
const carYear = ref(null)
const carMileage = ref(null)
const isAddCar = ref(null)
const selectedService = ref(null)
const serviceDescription = ref(null)
const carVin = ref(null)
const iKnowVin = ref(false)

const infoForm: Ref<null | {
  resetValidation: () => void
  reset: () => void
  validate: () => Promise<{ valid: boolean }>
}> = ref(null)


const carBrands = computed(() => carsFromJson.value.map(car => car.brand))
const carModels = computed(() => selectedCarBrand.value ? carsFromJson.value.find(car => car.brand === selectedCarBrand.value)?.models || [] : [])
const myCars = computed(() => {
  return cars.value.map(item => {
    return {value: item, title: item.manufacturer + " " + item.model + " " + item.productionYear.toString()}
  })
})

async function checkStepConditions(next: () => void) {
  let canProceedToNextStep = true

  if (currentStep.value === '2' && (!infoForm.value || !await validateForm(infoForm.value)))
    canProceedToNextStep = false

  if (canProceedToNextStep)
    next()
}

function resetState() {
  currentStep.value = '1'
  selectedCarModel.value = null
  selectedCarBrand.value = null
  carYear.value = null
  carMileage.value = null
  isAddCar.value = null
  iKnowVin.value = false
  carVin.value = null
}

onMounted(async () => {
  resetState()

  if (!cars.value.length && user.value)
    await carsStore.getUserCars(user.value)

  if (!carsFromJson.value.length)
    carsJsonStore.getCarsFromJson()
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
                :complete="currentStep > 1"
            />

            <v-divider/>

            <v-stepper-item
                :title="t('userBookFix.stepper.chooseCar')"
                value="2"
                color="secondary"
                :complete="currentStep > 2"
            />

            <v-divider/>

            <v-stepper-item
                :title="t('userBookFix.stepper.chooseMechanic')"
                value="3"
                color="secondary"
                :complete="currentStep > 3"
            />

            <v-divider/>

            <v-stepper-item
                :title="t('userBookFix.stepper.summary')"
                value="4"
                color="secondary"
                :complete="currentStep > 4"
            />
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item value="1">
              <v-form ref="credentialsForm">
                <div class="py-4">
                  <div class="text-h5 font-weight-bold text-center">
                    {{ t('userBookFix.stepper.first.title') }}
                  </div>

                  <v-divider class="my-2"/>

                  <v-radio-group
                      v-model="selectedService"
                      class="my-5"
                      color="primary"
                      :rules="requiredRule(t)"
                  >
                    <v-row>
                      <v-col
                          cols="12"
                          md="6"
                          lg="4"
                          sm="12"
                          v-for="(service, index) in services(t)"
                          :key="index"
                      >
                        <v-card variant="tonal" rounded="xl">
                          <v-card-title>
                            <v-radio :label="service.title" :value="service.value"></v-radio>
                          </v-card-title>
                        </v-card>

                      </v-col>
                    </v-row>
                  </v-radio-group>

                  <v-textarea
                      v-model="serviceDescription"
                      clearable
                      :label="t('userBookFix.stepper.first.description')"
                      variant="solo-filled"
                  />

                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="2">
              <v-form ref="infoForm">
                <div class="py-4">
                  <div class="text-h5 font-weight-bold text-center">
                    {{ t('userBookFix.stepper.second.carData') }}
                  </div>

                  <v-divider class="my-2"/>

                  <v-radio-group color="primary" v-model="isAddCar" :rules="requiredRule(t)">
                    <v-radio
                        :label="t('userBookFix.stepper.second.chooseFromYourCars')"
                        value="my"
                    />
                    <v-radio
                        :label="t('userBookFix.stepper.second.chooseOtherCar')"
                        value="add"
                    />
                  </v-radio-group>

                  <v-divider class="mb-4"/>
                  <div
                      v-if="isAddCar === 'add'"
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
                    <v-text-field
                        v-model.number="carMileage"
                        min="1"
                        type="number"
                        :label="t('userBookFix.stepper.second.mileage')"
                        :rules="[requiredRule(t)]"
                        suffix="km"
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
                  </div>

                  <div
                      v-if="isAddCar === 'my'"
                  >
                    <v-select
                        v-model="selectedCar"
                        :label="t('userBookFix.stepper.second.chooseCar')"
                        :items="myCars"
                    />

                    <v-text-field
                        v-model.number="carMileage"
                        min="1"
                        type="number"
                        :label="t('userBookFix.stepper.second.mileage')"
                        :rules="[requiredRule(t)]"
                        suffix="km"
                    />
                  </div>
                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="3">
              <div class="py-4">
                <div class="text-h5 font-weight-bold text-center">
                  {{ t('userBookFix.stepper.third.title') }}
                </div>

                <v-divider class="my-2"/>
              </div>
            </v-stepper-window-item>

            <v-stepper-window-item value="4">
              <div class="py-4">
                <div class="text-h5 font-weight-bold text-center">
                  {{ t('userBookFix.stepper.fourth.title') }}
                </div>

                <v-divider class="my-2"/>

                <div class="font-weight-bold my-1">
                  {{ t('userBookFix.stepper.fourth.repair') }}
                </div>

                {{ services(t).find(item => item.value === selectedService)?.title }}

                <br>

                {{ t('userBookFix.stepper.fourth.description') }}: {{ serviceDescription }}

                <v-divider class="my-2"/>

                <div class="font-weight-bold my-1">
                  {{ t('userBookFix.stepper.fourth.car') }}
                </div>

                <div v-if="selectedCar">
                  {{ selectedCar?.manufacturer }} {{ selectedCar?.model }} - {{ selectedCar?.productionYear }}
                </div>

                <div v-else>
                  {{ selectedCarBrand }} {{ selectedCarModel }} - {{ carYear }}
                </div>


                {{ t('userBookFix.stepper.second.mileage') }}: {{ carMileage }} km

                <v-divider class="my-2"/>

                <div class="font-weight-bold my-1">
                  {{ t('userBookFix.stepper.fourth.workshop') }}
                </div>

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

<script setup lang="ts">
import type {Ref} from "vue";
import {productionYearRule, requiredArrayRule, requiredRule} from "~/helpers/rules";
import {services} from "~/composable/services";
import {type ICar, mapICar} from "~/models/car";
import {type IFix, mapIFix} from "~/models/fix";
import WorkshopCard from "~/components/user/workshopCard.vue";
import type {IWorkshop} from "~/models/workshop";
import {formatDateToString} from "~/helpers/time";

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

const citiesFromJsonStore = useCitiesJsonStore()
const {citiesFromJson} = storeToRefs(citiesFromJsonStore)

const workshopStore = useWorkshopStore()
const {workshops} = storeToRefs(workshopStore)

const sharedStore = useSharedStore()
const {error, loading} = storeToRefs(sharedStore)

const fixStore = useFixesStore()

const currentStep = ref('1')
const selectedCar: Ref<ICar | null> = ref(null)
const selectedCarBrand = ref(null)
const selectedCarModel = ref(null)
const carYear = ref(null)
const carMileage = ref(null)
const isAddCar = ref(null)
const selectedServices = ref([])
const serviceDescription = ref(null)
const carVin = ref(null)
const iKnowVin = ref(false)
const companyCity = ref(null)
const canProceedToNextStep = ref(true)
const unselectedServices = ref(false)
const selectedWorkshop: Ref<IWorkshop | null> = ref(null)
const selectedDate: Ref<Date | null> = ref(null)

const infoForm: Ref<null | {
  resetValidation: () => void
  reset: () => void
  validate: () => Promise<{ valid: boolean }>
}> = ref(null)

const credentialsForm: Ref<null | {
  resetValidation: () => void
  reset: () => void
  validate: () => Promise<{ valid: boolean }>
}> = ref(null)

const workshopForm: Ref<null | {
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

function bookFixTime(workshop: IWorkshop, date: Date) {
  selectedDate.value = date
  selectedWorkshop.value = workshop
}

async function checkStepConditions(next: () => void) {
  canProceedToNextStep.value = true
  unselectedServices.value = false

  switch (currentStep.value) {
    case '1':
      if (!await credentialsForm.value?.validate() || !selectedServices.value.length) {
        canProceedToNextStep.value = false
        if (!selectedServices.value.length)
          unselectedServices.value = true
      }
      break;
    case '2':
      if (!await infoForm.value?.validate()) {
        canProceedToNextStep.value = false
      }
      break
    case '3':
      if (!await workshopForm.value?.validate() || !selectedDate.value || !selectedWorkshop.value) {
        canProceedToNextStep.value = false
      }
      break
  }

  if (canProceedToNextStep.value) {
    next()
  }
}


function resetState() {
  currentStep.value = '1'
  selectedCar.value = null
  selectedCarModel.value = null
  selectedCarBrand.value = null
  carYear.value = null
  carMileage.value = null
  isAddCar.value = null
  selectedServices.value = []
  serviceDescription.value = null
  iKnowVin.value = false
  carVin.value = null
  companyCity.value = null
  canProceedToNextStep.value = true
  unselectedServices.value = false
  selectedWorkshop.value = null
  selectedDate.value = null
}

async function bookFix() {
  const newObject: IFix = mapIFix({
    date: selectedDate.value || new Date(),
    bookDate: new Date(),
    car:
        isAddCar.value === 'my' && selectedCar.value
            ? mapICar({...selectedCar.value})
            : mapICar({
              manufacturer: selectedCarBrand.value || "",
              model: selectedCarModel.value || "",
              productionYear: Number(carYear.value),
              vin: iKnowVin.value ? carVin.value : "",
              userRef: "",
              reference: ""
            }),
    carMillage: Number(carMileage.value),
    companyRef: selectedWorkshop.value?.reference || "",
    description: serviceDescription.value || "",
    clientPhone: user.value?.profile?.phone || "",
    notifications: [],
    reference: "",
    services: selectedServices.value || [],
    userRef: user.value?.reference || ""
  })

  await fixStore.addFix(newObject)

  if (!error.value)
    navigateTo('/user/notifications')
}

onMounted(async () => {
  resetState()

  if (!cars.value.length && user.value)
    await carsStore.getUserCars(user.value)

  if (!carsFromJson.value.length)
    carsJsonStore.getCarsFromJson()

  if (!citiesFromJson.value.length)
    citiesFromJsonStore.getCitiesFromJson()

  if (workshops.value.length)
    workshopStore.deleteFindResult()
})

watch(companyCity, async (newCity) => {
  if (newCity) {
    await workshopStore.getWorkshopsByCityAndServices(newCity, selectedServices.value)
  }
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
              <v-form
                  v-model="canProceedToNextStep"
                  ref="credentialsForm"
              >
                <div class="py-4">
                  <div class="text-h5 font-weight-bold text-center">
                    {{ t('userBookFix.stepper.first.title') }}
                  </div>

                  <v-divider class="my-2"/>

                  <v-row class="my-3">
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
                          <v-checkbox
                              v-model="selectedServices"
                              :label="service.title"
                              :value="service.value"
                              color="primary"
                              class="hidden-checkbox"
                              hide-details
                          />
                        </v-card-title>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-textarea
                      v-model="serviceDescription"
                      clearable
                      :label="t('userBookFix.stepper.first.description')"
                      variant="solo-filled"
                      :rules="[requiredRule(t)]"
                  />

                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="2">
              <v-form
                  ref="infoForm"
                  v-model="canProceedToNextStep"
              >
                <div class="py-4">
                  <div class="text-h5 font-weight-bold text-center">
                    {{ t('userBookFix.stepper.second.carData') }}
                  </div>

                  <v-divider class="my-2"/>

                  <v-radio-group color="primary" v-model="isAddCar" :rules="[requiredRule(t)]">
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
                        :rules="[requiredRule(t)]"
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
                <v-form
                    ref="workshopForm"
                    v-model="canProceedToNextStep"
                >
                  <v-select
                      v-model="companyCity"
                      :label="t('companyProfile.city')"
                      :items="citiesFromJson"
                      :rules="[requiredRule(t), requiredArrayRule(t)]"
                  />

                  <div v-if="!workshops.length" align="center" class="my-5">
                    <v-progress-circular
                        v-if="loading"
                        :size="50"
                        color="primary"
                        indeterminate
                    />

                    <div v-else>
                      {{ t('userBookFix.stepper.third.noWorkshops') }}
                    </div>
                  </div>

                  <v-row v-else justify="center" align="center">
                    <v-col
                        v-for="(item) in workshops"
                        cols="12"
                        md="6"
                        xs="12"
                    >
                      <workshop-card
                          :workshop="item"
                          :is-presentation="false"
                          :book-fix="bookFixTime"
                      />
                    </v-col>
                  </v-row>

                  <div
                      v-if="selectedWorkshop && selectedDate"
                      class="my-5"
                  >
                    <div align="center" class="text-h6 my-2">{{ t('userBookFix.stepper.third.workshopSelected') }}</div>
                    <v-divider class="mb-3"/>

                    <workshop-card
                        :workshop="selectedWorkshop"
                        :is-presentation="true"
                        :book-fix="bookFixTime"
                    />

                    <div align="center" class="text-h6 my-2">
                      {{ t('userBookFix.stepper.third.dateSelected') }}: {{ formatDateToString(selectedDate) }}
                    </div>

                  </div>


                </v-form>

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

                <div class="mb-1">
                  <v-chip-group column>
                    <v-chip
                        v-for="(item) in selectedServices"
                        density="comfortable"
                        class="mr-1 my-2"
                    >
                      {{ services(t).find(x => x.value === item)?.title || '' }}
                    </v-chip>
                  </v-chip-group>
                </div>


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

                <div>
                  {{ citiesFromJsonStore.getCityName(selectedWorkshop?.city || '') }} {{ selectedWorkshop?.name }}
                </div>

                <div>
                  {{ formatDateToString(selectedDate) }}
                </div>

                <v-divider class="my-2"/>

                <div class="my-4 text-center">
                  <v-btn
                      @click="bookFix"
                  >
                    {{ t('userBookFix.stepper.fourth.book') }}
                  </v-btn>
                </div>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>

          <v-stepper-actions
              :next-text="t('userBookFix.stepper.nextStep')"
              :prev-text="t('userBookFix.stepper.prevStep')"
              @click:prev="prev"
              @click:next="checkStepConditions(next)"
          />
        </template>
      </v-stepper>
    </v-row>
  </v-container>


  <my-snackbar
      v-model="unselectedServices"
      :text="t('userBookFix.stepper.first.error')"
      :is-error="true"
  />
</template>

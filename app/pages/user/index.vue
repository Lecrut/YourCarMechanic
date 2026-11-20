<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import { productionYearRule, requiredRule, vinRule } from '~/utils/rules'
import { type ICar, mapICar } from '~/models/car'
import { mapIFix } from '~/models/fix'
import type { IWorkshop } from '~/models/workshop'
import { SERVICE_CATEGORIES, type ServiceCategory } from '~/models/service'
import { formatDateToString } from '~/utils/time'
import { carSegment, formatDuration, formatRange } from '~/models/priceList'
import WorkshopCard from '~/components/user/workshopCard.vue'

definePageMeta({ middleware: ['auth'], role: 'user' })

const { t } = useI18n()

const carsStore = useCarsStore()
const { cars } = storeToRefs(carsStore)
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const carsJsonStore = useCarsJsonStore()
const citiesJsonStore = useCitiesJsonStore()
const workshopStore = useWorkshopStore()
const { workshops, ratings } = storeToRefs(workshopStore)
const servicesStore = useServicesStore()
const sharedStore = useSharedStore()
const { error, loading } = storeToRefs(sharedStore)
const fixStore = useFixesStore()

type Form = InstanceType<typeof VForm>

const step = ref(1)
const servicesForm = ref<Form | null>(null)
const carForm = ref<Form | null>(null)
const workshopForm = ref<Form | null>(null)

const selectedServices = ref<string[]>([])
const serviceSearch = ref('')
const serviceCategory = ref<ServiceCategory>('diagnostics')

const visibleServices = computed(() => {
  const q = serviceSearch.value.trim().toLowerCase()
  return servicesStore.options.filter((s) => {
    if (q) return s.title.toLowerCase().includes(q)
    return s.category === serviceCategory.value
  })
})

const selectedInCategory = (cat: ServiceCategory) =>
  servicesStore.options.filter(s => s.category === cat && selectedServices.value.includes(s.value)).length
const serviceDescription = ref('')
const carSource = ref<'my' | 'add' | null>(null)
const selectedCar = ref<ICar | null>(null)
const selectedCarBrand = ref<string | null>(null)
const selectedCarModel = ref<string | null>(null)
const carYear = ref<number | null>(null)
const carMileage = ref<number | null>(null)
const iKnowVin = ref(false)
const carVin = ref('')
const city = ref<string | null>(null)
const selectedWorkshop = ref<IWorkshop | null>(null)
const selectedDate = ref<Date | null>(null)
const stepError = ref('')
const marketingConsent = ref(false)

const carBrands = computed(() => carsJsonStore.carsFromJson.map(car => car.brand))
const carModels = computed(() =>
  carsJsonStore.carsFromJson.find(car => car.brand === selectedCarBrand.value)?.models ?? [],
)
const myCars = computed(() =>
  cars.value.map(car => ({ value: car, title: `${car.manufacturer} ${car.model} ${car.productionYear}` })),
)

const bookedCar = computed(() =>
  carSource.value === 'my' && selectedCar.value
    ? selectedCar.value
    : mapICar({
        manufacturer: selectedCarBrand.value ?? '',
        model: selectedCarModel.value ?? '',
        productionYear: carYear.value ?? 1900,
        vin: iKnowVin.value ? carVin.value.trim().toUpperCase() : '',
      }),
)

const estimateFor = (workshop: IWorkshop, discounted = true) =>
  workshopStore.estimateFor(workshop, selectedServices.value, bookedCar.value.manufacturer, discounted)
const promotionFor = (workshop: IWorkshop) => workshopStore.promotionFor(workshop, selectedServices.value)
const durationFor = (workshop: IWorkshop) => workshopStore.durationFor(workshop, selectedServices.value)
const selectedEstimate = computed(() => (selectedWorkshop.value ? estimateFor(selectedWorkshop.value) : null))
const selectedPromotion = computed(() => (selectedWorkshop.value ? promotionFor(selectedWorkshop.value) : null))

function bookTime(workshop: IWorkshop, date: Date) {
  selectedWorkshop.value = workshop
  selectedDate.value = date
}

async function next() {
  stepError.value = ''
  const validate = async (f: Form | null) => (await f?.validate())?.valid ?? false

  switch (step.value) {
    case 1:
      if (!selectedServices.value.length) {
        stepError.value = t('userBookFix.stepper.first.error')
        return
      }
      if (!(await validate(servicesForm.value))) return
      break
    case 2:
      if (!(await validate(carForm.value))) return
      break
    case 3:
      if (!(await validate(workshopForm.value))) return
      if (!selectedWorkshop.value || !selectedDate.value) {
        stepError.value = t('userBookFix.stepper.third.chooseDate')
        return
      }
      break
  }
  step.value++
}

async function bookFix() {
  if (!user.value || !selectedWorkshop.value || !selectedDate.value) return

  await fixStore.addFix(mapIFix({
    date: selectedDate.value,
    bookDate: new Date(),
    car: bookedCar.value,
    carRef: carSource.value === 'my' ? selectedCar.value?.reference ?? '' : '',
    durationHours: durationFor(selectedWorkshop.value),
    carMillage: Number(carMileage.value),
    companyRef: selectedWorkshop.value.reference,
    description: serviceDescription.value,
    clientPhone: user.value.profile?.phone ?? '',
    clientName: `${user.value.profile?.name ?? ''} ${user.value.profile?.surname ?? ''}`.trim(),
    marketingConsent: marketingConsent.value,
    services: selectedServices.value,
    userRef: user.value.reference,
    estimate: selectedEstimate.value,
    promotion: selectedPromotion.value ? { title: selectedPromotion.value.title, percent: selectedPromotion.value.percent } : null,
    createdBy: 'user',
  }))

  if (!error.value) {
    await navigateTo('/user/notifications')
    return
  }
  // Someone booked this hour in the meantime – back to choosing a time (the error snackbar explains why).
  if (sharedStore.errorMessage === 'errors.slotTaken') {
    selectedDate.value = null
    step.value = 3
  }
}

onMounted(() => {
  if (user.value) carsStore.getUserCars(user.value.reference)
  carsJsonStore.getCarsFromJson()
  citiesJsonStore.getCitiesFromJson()
  workshopStore.deleteFindResult()
})

// Changing the city *or* the chosen services invalidates the workshop list and the picked time.
watch([city, selectedServices], ([newCity, services]) => {
  selectedWorkshop.value = null
  selectedDate.value = null
  if (newCity) workshopStore.getWorkshopsByCityAndServices(newCity, services)
}, { deep: true })
</script>

<template>
  <div>
    <v-container class="py-8">
      <v-stepper
        v-model="step"
        alt-labels
        class="mx-auto"
        max-width="1000"
        elevation="3"
        rounded="xl"
      >
        <v-stepper-header>
          <v-stepper-item
            :title="t('userBookFix.stepper.chooseRepair')"
            :value="1"
            :complete="step > 1"
            icon="mdi-wrench"
            color="primary"
          />
          <v-divider />
          <v-stepper-item
            :title="t('userBookFix.stepper.chooseCar')"
            :value="2"
            :complete="step > 2"
            icon="mdi-car"
            color="primary"
          />
          <v-divider />
          <v-stepper-item
            :title="t('userBookFix.stepper.chooseMechanic')"
            :value="3"
            :complete="step > 3"
            icon="mdi-garage"
            color="primary"
          />
          <v-divider />
          <v-stepper-item
            :title="t('userBookFix.stepper.summary')"
            :value="4"
            icon="mdi-check"
            color="primary"
          />
        </v-stepper-header>

        <v-stepper-window>
          <v-stepper-window-item :value="1">
            <h2 class="text-headline-small font-weight-bold text-center mb-6">
              {{ t('userBookFix.stepper.first.title') }}
            </h2>

            <v-text-field
              v-model="serviceSearch"
              :label="t('moderator.search')"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              class="mb-4"
            />

            <v-chip-group
              v-if="!serviceSearch?.trim()"
              v-model="serviceCategory"
              mandatory
              selected-class="text-primary"
              class="mb-4"
            >
              <v-chip
                v-for="cat in SERVICE_CATEGORIES"
                :key="cat"
                :value="cat"
                variant="tonal"
              >
                {{ t(`serviceCategories.${cat}`) }}
                <template
                  v-if="selectedInCategory(cat)"
                  #append
                >
                  <v-badge
                    :content="selectedInCategory(cat)"
                    color="primary"
                    inline
                    class="ml-1"
                  />
                </template>
              </v-chip>
            </v-chip-group>

            <v-item-group
              v-model="selectedServices"
              multiple
            >
              <v-row>
                <v-col
                  v-for="service in visibleServices"
                  :key="service.value"
                  cols="6"
                  md="4"
                >
                  <v-item
                    v-slot="{ isSelected, toggle }"
                    :value="service.value"
                  >
                    <v-card
                      :color="isSelected ? 'primary' : undefined"
                      :variant="isSelected ? 'flat' : 'tonal'"
                      hover
                      class="pa-4 d-flex align-center ga-2"
                      :data-testid="`service-${service.value}`"
                      @click="toggle"
                    >
                      <v-icon :icon="isSelected ? 'mdi-check-circle' : 'mdi-circle-outline'" />
                      <span class="text-title-medium">{{ service.title }}</span>
                    </v-card>
                  </v-item>
                </v-col>
              </v-row>
            </v-item-group>

            <v-form
              ref="servicesForm"
              class="mt-6"
            >
              <v-textarea
                v-model="serviceDescription"
                clearable
                auto-grow
                rows="3"
                :label="t('userBookFix.stepper.first.description')"
                :rules="[requiredRule(t)]"
                data-testid="description"
              />
            </v-form>
          </v-stepper-window-item>

          <v-stepper-window-item :value="2">
            <h2 class="text-headline-small font-weight-bold text-center mb-6">
              {{ t('userBookFix.stepper.second.carData') }}
            </h2>

            <v-form ref="carForm">
              <v-radio-group
                v-model="carSource"
                color="primary"
                :rules="[requiredRule(t)]"
              >
                <v-radio
                  :label="t('userBookFix.stepper.second.chooseFromYourCars')"
                  value="my"
                  :disabled="!cars.length"
                />
                <v-radio
                  :label="t('userBookFix.stepper.second.chooseOtherCar')"
                  value="add"
                />
              </v-radio-group>

              <v-expand-transition>
                <div v-if="carSource === 'add'">
                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-autocomplete
                        v-model="selectedCarBrand"
                        :label="t('userBookFix.stepper.second.carBrand')"
                        :items="carBrands"
                        variant="outlined"
                        density="comfortable"
                        :rules="[requiredRule(t)]"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-autocomplete
                        v-model="selectedCarModel"
                        :label="t('userBookFix.stepper.second.carModel')"
                        :items="carModels"
                        variant="outlined"
                        density="comfortable"
                        :rules="[requiredRule(t)]"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model.number="carYear"
                        type="number"
                        :label="t('userBookFix.stepper.second.productionYear')"
                        :rules="[requiredRule(t), productionYearRule(t)]"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-switch
                        v-model="iKnowVin"
                        :label="t('userBookFix.stepper.second.iKnowVin')"
                        color="primary"
                      />
                    </v-col>
                    <v-col
                      v-if="iKnowVin"
                      cols="12"
                    >
                      <v-text-field
                        v-model="carVin"
                        :label="t('userBookFix.stepper.second.vin')"
                        :hint="t('userBookFix.stepper.second.vinHint')"
                        counter="17"
                        :rules="[requiredRule(t), vinRule(t)]"
                      />
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>

              <v-expand-transition>
                <v-select
                  v-if="carSource === 'my'"
                  v-model="selectedCar"
                  :label="t('userBookFix.stepper.second.chooseCar')"
                  :items="myCars"
                  :rules="[requiredRule(t)]"
                />
              </v-expand-transition>

              <v-text-field
                v-if="carSource"
                v-model.number="carMileage"
                min="1"
                type="number"
                :label="t('userBookFix.stepper.second.mileage')"
                :rules="[requiredRule(t)]"
                suffix="km"
              />
            </v-form>
          </v-stepper-window-item>

          <v-stepper-window-item :value="3">
            <h2 class="text-headline-small font-weight-bold text-center mb-6">
              {{ t('userBookFix.stepper.third.title') }}
            </h2>

            <v-form ref="workshopForm">
              <v-autocomplete
                v-model="city"
                :label="t('companyProfile.city')"
                :items="citiesJsonStore.citiesFromJson"
                prepend-inner-icon="mdi-city"
                variant="outlined"
                density="comfortable"
                :rules="[requiredRule(t)]"
                data-testid="city"
              />
            </v-form>

            <div
              v-if="loading && !workshops.length"
              class="text-center my-5"
            >
              <v-progress-circular
                :size="50"
                color="primary"
                indeterminate
              />
            </div>

            <v-empty-state
              v-else-if="city && !workshops.length"
              icon="mdi-garage-alert"
              :title="t('userBookFix.stepper.third.noWorkshops')"
            />

            <v-row v-else>
              <v-col
                v-for="item in workshops"
                :key="item.reference"
                cols="12"
                md="6"
              >
                <workshop-card
                  :workshop="item"
                  :is-presentation="false"
                  :estimate="estimateFor(item)"
                  :estimate-before="estimateFor(item, false)"
                  :promotion="promotionFor(item)"
                  :duration-hours="durationFor(item)"
                  :rating="ratings[item.reference]"
                  :selected="selectedWorkshop?.reference === item.reference"
                  @book="bookTime"
                />
              </v-col>
            </v-row>

            <v-expand-transition>
              <v-alert
                v-if="selectedWorkshop && selectedDate"
                type="success"
                variant="tonal"
                class="mt-4"
                icon="mdi-calendar-check"
                :title="`${t('userBookFix.stepper.third.workshopSelected')}: ${selectedWorkshop.name}`"
                :text="`${t('userBookFix.stepper.third.dateSelected')}: ${formatDateToString(selectedDate)}`"
              />
            </v-expand-transition>
          </v-stepper-window-item>

          <v-stepper-window-item :value="4">
            <h2 class="text-headline-small font-weight-bold text-center mb-6">
              {{ t('userBookFix.stepper.fourth.title') }}
            </h2>

            <v-list
              lines="two"
              bg-color="transparent"
            >
              <v-list-item
                prepend-icon="mdi-wrench"
                :title="t('userBookFix.stepper.fourth.repair')"
              >
                <v-chip-group column>
                  <v-chip
                    v-for="item in selectedServices"
                    :key="item"
                    color="primary"
                    variant="tonal"
                    density="comfortable"
                  >
                    {{ servicesStore.label(item) }}
                  </v-chip>
                </v-chip-group>
                <p class="text-body-medium mt-1">
                  {{ serviceDescription }}
                </p>
              </v-list-item>

              <v-divider inset />

              <v-list-item
                prepend-icon="mdi-car"
                :title="t('userBookFix.stepper.fourth.car')"
                :subtitle="`${bookedCar.manufacturer} ${bookedCar.model} - ${bookedCar.productionYear} · ${carMileage} km`"
              />

              <v-divider inset />

              <v-list-item
                prepend-icon="mdi-garage"
                :title="t('userBookFix.stepper.fourth.workshop')"
                :subtitle="`${selectedWorkshop?.name ?? ''}, ${citiesJsonStore.getCityName(selectedWorkshop?.city ?? '')} ${selectedWorkshop?.address ?? ''}`"
              />

              <v-divider inset />

              <v-list-item
                prepend-icon="mdi-calendar"
                :title="selectedDate ? formatDateToString(selectedDate) : ''"
                :subtitle="selectedWorkshop ? `${t('duration.expected')}: ${formatDuration(durationFor(selectedWorkshop))}` : ''"
              />

              <v-divider inset />

              <v-list-item
                prepend-icon="mdi-cash-multiple"
                :title="selectedEstimate ? formatRange(selectedEstimate) + (selectedPromotion ? ` (−${selectedPromotion.percent}% · ${selectedPromotion.title})` : '') : t('pricing.noEstimate')"
                :subtitle="t('pricing.estimateSegment', { segment: t(`pricing.segments.${carSegment(bookedCar.manufacturer)}`) })"
              >
                <template #append>
                  <v-icon
                    v-tooltip:left="t('pricing.estimateHint')"
                    icon="mdi-information-outline"
                    color="medium-emphasis"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-checkbox
              v-model="marketingConsent"
              color="primary"
              hide-details
              :label="t('clients.consentCheckbox', { workshop: selectedWorkshop?.name ?? '' })"
              data-testid="marketing-consent"
            />

            <div class="text-center mt-6">
              <v-btn
                size="large"
                prepend-icon="mdi-check"
                :loading="loading"
                data-testid="book"
                @click="bookFix"
              >
                {{ t('userBookFix.stepper.fourth.book') }}
              </v-btn>
            </div>
          </v-stepper-window-item>
        </v-stepper-window>

        <v-expand-transition>
          <v-alert
            v-if="stepError"
            type="warning"
            variant="tonal"
            class="mx-6 mb-2"
            :text="stepError"
            data-testid="step-error"
          />
        </v-expand-transition>

        <v-stepper-actions
          :next-text="t('userBookFix.stepper.nextStep')"
          :prev-text="t('userBookFix.stepper.prevStep')"
          :disabled="step === 4 ? 'next' : step === 1 ? 'prev' : false"
          @click:prev="step--"
          @click:next="next"
        />
      </v-stepper>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import AddCarForm from "~/components/user/addCarForm.vue";
import CarCard from "~/components/user/carCard.vue";

definePageMeta({
  layout: 'user',
})
const {t} = useI18n()

const carsStore = useCarsStore()
const {cars} = storeToRefs(carsStore)

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const isShowCarForm = ref(false)
const showSuccessAddCar = ref(false)
const showSuccessUpdateCar = ref(false)

watch(cars, async (newCars, oldCars) => {
  if (Number(newCars.length) === Number(oldCars.length) + 1)
    showSuccessAddCar.value = true
  if (newCars.length === oldCars.length && newCars.length)
    showSuccessUpdateCar.value = true

  if (!newCars.length && user.value)
    await carsStore.getUserCars(user.value)
})

onMounted(async () => {
  if (!cars.value.length && user.value)
    await carsStore.getUserCars(user.value)
})
</script>

<template>
  <v-container class="h-auto my-15">
    <v-sheet
        class="d-flex align-center justify-center flex-wrap text-center mx-auto my-10 px-4"
        elevation="4"
        max-width="1100"
        rounded
    >
      <v-row justify="center">
        <v-col cols="12" sm="12" md="6">
          <div class="d-flex flex-column align-center justify-center h-100 pa-6">
            <v-img
                class="mx-auto my-5 elevation-5"
                rounded="xl"
                :width="300"
                aspect-ratio="4/3"
                cover
                src="/userProfile.jpg"
            />
          </div>
        </v-col>
        <v-col cols="12" sm="12" md="6">
          <div class="d-flex flex-column align-center justify-center h-100 py-3">
            <div class="text-h5 my-2">
              {{ t('userProfile.title') }}
            </div>

            <form v-if="user?.profile" class="w-75 my-2">
              <div>
                <v-text-field
                    :model-value="user?.profile?.name"
                    :label="t('userProfile.userName')"
                    readonly
                />

                <v-text-field
                    :model-value="user?.profile?.surname"
                    :label="t('userProfile.userSurname')"
                    readonly
                />

                <v-text-field
                    :model-value="user?.profile?.phone"
                    :label="t('userProfile.userPhone')"
                    readonly
                />

                <v-text-field
                    :model-value="user?.email"
                    :label="t('userProfile.email')"
                    placeholder="example@mail.com"
                    type="email"
                    readonly
                />
              </div>
            </form>

            <div v-else align="center" class="mt-5">
              <v-progress-circular
                  :size="50"
                  color="primary"
                  indeterminate
              />
            </div>
          </div>
        </v-col>
      </v-row>
    </v-sheet>

    <v-sheet
        class="align-center justify-center text-center mx-auto my-10 px-4"
        elevation="4"
        max-width="1100"
        rounded
    >
      <v-row justify="center">
        <v-col cols="12" class="pa-3" justify="center">
          <div class="text-h5 ma-3 mt-6">
            {{ t('userProfile.yourCars') }}
          </div>

          <v-img
              class="mx-auto my-5 elevation-5"
              rounded="xl"
              :width="300"
              aspect-ratio="4/3"
              cover
              src="/addCar.jpg"
          />
        </v-col>
      </v-row>

      <v-row cols="12" justify="center">
        <v-col
            v-for="(car) in cars"
            cols="12"
            md="4"
            sm="12"
        >
          <car-card
              :only-show="false"
              :car="car"
          />
        </v-col>
      </v-row>

      <div align="center" class="my-4">
        <v-btn class="my-5" @click="isShowCarForm = true">
          {{ t('userProfile.addCar') }}
        </v-btn>
      </div>


    </v-sheet>

  </v-container>

  <my-snackbar
      v-model="showSuccessAddCar"
      :is-error="false"
      :text="t('userProfile.addCarSuccess')"
  />

  <my-snackbar
      v-model="showSuccessUpdateCar"
      :is-error="false"
      :text="t('userProfile.updateCarSuccess')"
  />

  <add-car-form
      v-model="isShowCarForm"
      :car="null"
  />
</template>

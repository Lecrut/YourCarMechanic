<script setup lang="ts">
import AddCarForm from "~/components/user/addCarForm.vue";

definePageMeta({
  layout: 'user',
})
const {t} = useI18n()

const carsStore = useCarsStore()
const {cars} = storeToRefs(carsStore)

const isShowCarForm = ref(false)
const showSuccessAddCar = ref(false)
const showSuccessUpdateCar = ref(false)

watch(cars, (newCars, oldCars) => {
  if (newCars.length === oldCars.length + 1)
    showSuccessAddCar.value = true
  else
    showSuccessUpdateCar.value = true

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

            <form class="w-75 my-2">
              <div>
                <v-text-field
                    :label="t('userProfile.userName')"
                    readonly
                />

                <v-text-field
                    :label="t('userProfile.userSurname')"
                    readonly
                />

                <v-text-field
                    :label="t('userProfile.userPhone')"
                    readonly
                />

                <v-text-field
                    :label="t('userProfile.email')"
                    placeholder="example@mail.com"
                    type="email"
                    readonly
                />
              </div>
            </form>
          </div>
        </v-col>
      </v-row>
    </v-sheet>

    <v-sheet
        class="d-flex align-center justify-center flex-wrap text-center mx-auto my-10 px-4"
        elevation="4"
        max-width="1100"
        rounded
    >
      <v-row justify="center">
        <v-col cols="12" sm="12" md="6" class="pa-3">
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

          <v-btn class="my-5" @click="isShowCarForm = true">
            {{ t('userProfile.addCar') }}
          </v-btn>

        </v-col>
      </v-row>
    </v-sheet>
    {{ cars.length }}

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

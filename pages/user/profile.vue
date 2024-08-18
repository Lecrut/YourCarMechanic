<script setup lang="ts">
definePageMeta({
  layout: 'user',
})
  const { t } = useI18n()

  const isShowCarForm = ref(false)

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
              {{  t('userProfile.title') }}
            </div>

            <form class="w-75 my-2">
              <div>
                <v-text-field
                    :label="t('userProfile.userName')"
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
            {{  t('userProfile.yourCars') }}
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
            {{  t('userProfile.addCar') }}
          </v-btn>

<!--          <div v-if="!cars.length" class="text-h5 my-5">-->
<!--            Brak samochodów do wyświetlenia.-->
<!--          </div>-->

<!--          <div v-else v-for="(car, index) in cars" :item="car" :key="index">-->
<!--            <v-card-->
<!--                class="my-5"-->
<!--                elevation="10"-->
<!--            >-->
<!--              <v-card-title>-->
<!--                {{car.brand}} {{car.model}}-->
<!--              </v-card-title>-->
<!--              <v-card-text>-->
<!--                {{car.registrationNum}}-->
<!--              </v-card-text>-->
<!--            </v-card>-->
<!--          </div>-->
        </v-col>
      </v-row>
    </v-sheet>

  </v-container>
</template>

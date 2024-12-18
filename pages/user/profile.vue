<script setup lang="ts">
import AddCarForm from "~/components/user/addCarForm.vue";
import CarCard from "~/components/user/carCard.vue";
import {phoneRule, requiredRule} from "~/helpers/rules";
import formValidation from "~/helpers/formValidation";
import {type IUserProfile, mapIUserProfile} from "~/models/userProfile";

definePageMeta({
  layout: 'user',
})
const {t} = useI18n()

const carsStore = useCarsStore()
const {cars} = storeToRefs(carsStore)

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const sharedStore = useSharedStore()
const {error} = storeToRefs(sharedStore)

const {form, valid, isValid} = formValidation()

const isShowCarForm = ref(false)
const showSuccessAddCar = ref(false)
const showSuccessUpdateCar = ref(false)
const showSuccessUpdateProfile = ref(false)

const userName = ref('')
const userSurnameName = ref('')
const userPhone = ref('')

const userEmail = ref('')

const isEditing = ref(false)

async function updateProfile() {
  if (await isValid()) {
    await authStore.updateUserProfile(mapIUserProfile({
      name: userName.value, phone: userPhone.value, surname: userSurnameName.value
    }))

    if (!error.value) {
      showSuccessUpdateProfile.value = true
      isEditing.value = false
    }
  }
}

function assignUser(user: IUserProfile) {
  userName.value = user.name || ''
  userSurnameName.value = user.surname || ''
  userPhone.value = user.phone || ''
}

watch(cars, async (newCars, oldCars) => {
  if (Number(newCars.length) === Number(oldCars.length) + 1)
    showSuccessAddCar.value = true
  if (newCars.length === oldCars.length && newCars.length)
    showSuccessUpdateCar.value = true

  if (!newCars.length && user.value)
    await carsStore.getUserCars(user.value)
})

watch(user, (newValue) => {
  if (newValue && newValue.profile) {
    assignUser(newValue.profile)
    userEmail.value = newValue.email
  }
})

onMounted(async () => {
  if (!cars.value.length && user.value)
    await carsStore.getUserCars(user.value)

  if (user.value?.profile) {
    assignUser(user.value.profile)
    userEmail.value = user.value.email
  }
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

            <v-form
                ref="form"
                v-model="valid"
                @submit.prevent="updateProfile"
                class="w-75 my-2"
            >
              <div>
                <v-text-field
                    v-model="userName"
                    :label="t('userProfile.userName')"
                    :readonly="!isEditing"
                    :rules="[requiredRule(t)]"
                />

                <v-text-field
                    v-model="userSurnameName"
                    :label="t('userProfile.userSurname')"
                    :readonly="!isEditing"
                    :rules="[requiredRule(t)]"
                />

                <v-text-field
                    v-model="userPhone"
                    :label="t('userProfile.userPhone')"
                    :readonly="!isEditing"
                    :rules="[requiredRule(t), phoneRule(t)]"
                />

                <v-text-field
                    v-model="userEmail"
                    :label="t('userProfile.email')"
                    placeholder="example@mail.com"
                    type="email"
                    readonly
                />
              </div>

              <v-row
                  v-if="!isEditing"
                  justify="center"
                  class="mb-5">
                <v-btn
                    prepend-icon="mdi-pencil"
                    @click="isEditing=true"
                >
                  {{ t('universal.edit') }}
                </v-btn>
              </v-row>

              <v-row
                  v-else
                  justify="center"
                  class="mb-5"
              >
                <v-btn
                    class="mx-2"
                    color="default"
                    variant="outlined"
                    @click="isEditing=false"
                >
                  {{ t('universal.cancel') }}
                </v-btn>

                <v-btn
                    class="mx-2"
                    @click="updateProfile"
                >
                  {{ t('universal.save') }}
                </v-btn>
              </v-row>

            </v-form>
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

  <my-snackbar
      v-model="showSuccessUpdateProfile"
      :is-error="false"
      :text="t('userProfile.updateProfileSuccess')"
  />

  <add-car-form
      v-model="isShowCarForm"
      :car="null"
  />
</template>

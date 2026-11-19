<script setup lang="ts">
import AddCarForm from '~/components/user/addCarForm.vue'
import CarCard from '~/components/user/carCard.vue'
import PageHeader from '~/components/pageHeader.vue'
import { phoneRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'
import { mapIUserProfile } from '~/models/userProfile'

definePageMeta({ middleware: ['auth'], role: 'user' })

const { t } = useI18n()

const carsStore = useCarsStore()
const { cars } = storeToRefs(carsStore)
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const sharedStore = useSharedStore()
const { error, loading } = storeToRefs(sharedStore)

const { form, valid, isValid } = formValidation()

const isShowCarForm = ref(false)
const isEditing = ref(false)
const showSuccess = ref(false)
const profile = ref(mapIUserProfile(user.value?.profile ?? {}))

function cancel() {
  profile.value = mapIUserProfile(user.value?.profile ?? {})
  isEditing.value = false
}

async function updateProfile() {
  if (!(await isValid())) return
  await authStore.updateUserProfile(profile.value)
  if (!error.value) {
    showSuccess.value = true
    isEditing.value = false
  }
}

onMounted(() => {
  if (user.value) carsStore.getUserCars(user.value.reference)
})
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('userProfile.title')"
        :subtitle="user?.email"
        icon="mdi-account"
      />

      <v-row>
        <v-col
          cols="12"
          md="5"
        >
          <v-card
            class="pa-6 h-100"
            elevation="2"
          >
            <v-form
              ref="form"
              v-model="valid"
              :readonly="!isEditing"
              @submit.prevent="updateProfile"
            >
              <v-text-field
                v-model="profile.name"
                :label="t('userProfile.userName')"
                prepend-inner-icon="mdi-account-outline"
                :rules="[requiredRule(t)]"
              />
              <v-text-field
                v-model="profile.surname"
                :label="t('userProfile.userSurname')"
                prepend-inner-icon="mdi-account-outline"
                :rules="[requiredRule(t)]"
              />
              <v-text-field
                v-model="profile.phone"
                :label="t('userProfile.userPhone')"
                prepend-inner-icon="mdi-phone-outline"
                :rules="[requiredRule(t), phoneRule(t)]"
              />
            </v-form>

            <div class="d-flex justify-end ga-2">
              <v-btn
                v-if="!isEditing"
                prepend-icon="mdi-pencil"
                @click="isEditing = true"
              >
                {{ t('universal.edit') }}
              </v-btn>
              <template v-else>
                <v-btn
                  variant="text"
                  color="default"
                  @click="cancel"
                >
                  {{ t('universal.cancel') }}
                </v-btn>
                <v-btn
                  :loading="loading"
                  @click="updateProfile"
                >
                  {{ t('universal.save') }}
                </v-btn>
              </template>
            </div>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="7"
        >
          <v-card
            class="pa-6 h-100"
            elevation="2"
          >
            <div class="d-flex align-center mb-4">
              <h2 class="text-title-large font-weight-bold">
                {{ t('userProfile.yourCars') }}
              </h2>
              <v-spacer />
              <v-btn
                prepend-icon="mdi-plus"
                data-testid="add-car"
                @click="isShowCarForm = true"
              >
                {{ t('userProfile.addCar') }}
              </v-btn>
            </div>

            <v-empty-state
              v-if="!cars.length && !loading"
              icon="mdi-car-off"
              :title="t('userProfile.noCars')"
            />

            <v-row>
              <v-col
                v-for="car in cars"
                :key="car.reference"
                cols="12"
                sm="6"
              >
                <car-card
                  :only-show="false"
                  :car="car"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <my-snackbar
      v-model="showSuccess"
      :is-error="false"
      :text="t('userProfile.updateProfileSuccess')"
    />

    <add-car-form
      v-model="isShowCarForm"
      :car="null"
    />
  </div>
</template>

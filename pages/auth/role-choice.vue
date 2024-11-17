<script setup lang="ts">
import {roles} from "~/composable/roles";
import {emailRule, lengthRuleShort, phoneRule, requiredArrayRule, requiredRule} from "~/helpers/rules";
import formValidation from "~/helpers/formValidation";
import {services} from "~/composable/services";
import {useAuthStore} from "~/stores/authStore";
import {mapIUserProfile} from "~/models/userProfile";
import {mapIWorkshop} from "~/models/workshop";

definePageMeta({
  layout: 'no-role',
})

const {t} = useI18n()
const {form, valid, isValid} = formValidation()

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const sharedStore = useSharedStore()
const {error} = storeToRefs(sharedStore)

const selectedRole = ref(null)
const isRoleSelected = ref(false)

const userName = ref(null)
const userSurname = ref(null)
const userPhone = ref(null)

const companyName = ref(null)
const companyNip = ref(null)
const companyCity = ref(null)
const companyAddress = ref(null)
const companyPhone = ref(null)
const companyOpeningTime = ref(null)
const companyClosingTime = ref(null)
const companyServices = ref(null)


function chooseRole() {
  isRoleSelected.value = true
}

async function savePersonalData() {
  if (await isValid()) {
    if (selectedRole.value === 'user') {
      const userProfile = mapIUserProfile({
        name: userName.value,
        surname: userSurname.value,
        phone: userPhone.value,
      })
      await authStore.updateUserProfile(userProfile)
      if (!error.value)
        navigateTo('/user')
    } else {
      await authStore.createCompany(mapIWorkshop({
        address: companyAddress.value || "",
        city: companyCity.value || "",
        closingTime: companyClosingTime.value || 0,
        name: companyName.value || "",
        nip: companyNip.value || "",
        openingTime: companyClosingTime.value || 0,
        phone: companyPhone.value || "",
        reference: "",
        services: companyServices.value || []
      }))
      if (!error.value)
        navigateTo('/company')
    }
  }
}
</script>

<template>
  <v-container class="h-auto my-15">
    <v-sheet
        class="align-center justify-center text-center mx-auto my-10 px-4 py-5"
        elevation="4"
        max-width="1100"
        rounded
    >
      <div class="text-h5 my-4">
        {{
          isRoleSelected
              ? selectedRole === 'user'
                  ? t('noRole.userProfile')
                  : t('noRole.companyProfile')
              : t('noRole.chooseRole')
        }}
      </div>
      <v-divider/>

      <div v-if="!isRoleSelected">
        <v-radio-group
            v-model="selectedRole"
            class="my-5"
            color="primary"
            :rules="requiredRule(t)"
        >
          <v-row justify="center">
            <v-col
                cols="12"
                md="6"
                lg="4"
                sm="12"
                v-for="(role, index) in roles(t)"
                :key="index"
            >
              <v-card variant="tonal" rounded="xl">
                <v-card-title>
                  <v-radio :label="role.title" :value="role.value"></v-radio>
                </v-card-title>
              </v-card>

            </v-col>
          </v-row>
        </v-radio-group>

        <div>
          <v-btn
              :disabled="!selectedRole"
              @click="chooseRole"
          >
            {{ t('noRole.select') }}
          </v-btn>
        </div>
      </div>


      <v-row v-if="isRoleSelected && selectedRole === 'user'" justify="center">
        <v-col cols="12" md="6" sm="12">
          <v-form
              ref="form"
              class="my-6 mx-4"
              v-model="valid"
              @submit.prevent="savePersonalData"
          >
            <v-text-field
                v-model="userName"
                :label="t('userProfile.userName')"
                type="text"
                @keyup.enter="savePersonalData"
                :rules="[requiredRule(t)]"
            />

            <v-text-field
                v-model="userSurname"
                :label="t('userProfile.userSurname')"
                type="text"
                @keyup.enter="savePersonalData"
                :rules="[requiredRule(t)]"
            />

            <v-text-field
                v-model="userPhone"
                :label="t('userProfile.userPhone')"
                @keyup.enter="savePersonalData"
                type="number"
                :rules="[requiredRule(t), phoneRule(t)]"
            />

            <v-row
                justify="center"
                class="my-5"
            >
              <v-btn
                  class="mx-2"
                  color="default"
                  variant="outlined"
                  @click="isRoleSelected=false"
              >
                {{ t('universal.cancel') }}
              </v-btn>

              <v-btn
                  class="mx-2"
                  @click="savePersonalData"
              >
                {{ t('universal.save') }}
              </v-btn>
            </v-row>
          </v-form>
        </v-col>
      </v-row>


      <div v-if="isRoleSelected && selectedRole === 'workshop'">
        <v-form
            v-model="valid"
            ref="form"
            class="my-6 mx-4"
            @submit.prevent="savePersonalData"
        >
          <v-row justify="center">
            <v-col cols="12" sm="12" md="12">
              <v-text-field
                  v-model="companyName"
                  :label="t('companyProfile.name')"
                  :rules="[requiredRule(t)]"
              />
            </v-col>

            <v-col cols="12" sm="12" md="6">
              <v-text-field
                  v-model="companyNip"
                  :label="t('companyProfile.nip')"
                  :rules="[requiredRule(t), lengthRuleShort(t)]"
              />
            </v-col>

            <v-col cols="12" sm="12" md="6">
              <v-text-field
                  :value="user.email || ''"
                  :label="t('companyProfile.email')"
                  readonly
                  placeholder="example@mail.com"
              />
            </v-col>

            <v-col cols="12" sm="12" md="6">
              <v-select
                  v-model="companyCity"
                  :label="t('companyProfile.city')"
                  :rules="[requiredRule(t), requiredArrayRule(t)]"
              />
            </v-col>

            <v-col cols="12" sm="12" md="6">
              <v-text-field
                  v-model="companyAddress"
                  :label="t('companyProfile.address')"
                  :rules="[requiredRule(t)]"
              />
            </v-col>

            <v-col cols="12" sm="12" md="6">
              <v-text-field
                  v-model="companyPhone"
                  :label="t('companyProfile.phone')"
                  type="number"
                  :rules="[requiredRule(t), phoneRule(t)]"
              />
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-text-field
                  v-model="companyOpeningTime"
                  :label="t('companyProfile.openingTime')"
                  type="number"
                  :rules="[requiredRule(t)]"
              />
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-text-field
                  v-model="companyClosingTime"
                  :label="t('companyProfile.closingTime')"
                  type="number"
                  :rules="[requiredRule(t)]"
              />
            </v-col>

            <v-col cols="12" sm="12">
              <v-select
                  v-model="companyServices"
                  :label="t('companyProfile.services')"
                  :items="services(t)"
                  chips
                  multiple
                  :rules="[
                    requiredRule(t),
                    requiredArrayRule(t)
                ]"
              ></v-select>
            </v-col>
          </v-row>

          <v-row
              justify="center"
              class="my-5"
          >
            <v-btn
                class="mx-2"
                color="default"
                variant="outlined"
                @click="isRoleSelected=false"
            >
              {{ t('universal.cancel') }}
            </v-btn>

            <v-btn
                class="mx-2"
                @click="savePersonalData"
            >
              {{ t('universal.save') }}
            </v-btn>
          </v-row>
        </v-form>
      </div>
    </v-sheet>
  </v-container>

  <my-snackbar
      v-model="error"
      :text="t('universal.error')"
      :is-error="true"
  />
  
</template>
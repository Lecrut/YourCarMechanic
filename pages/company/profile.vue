<script setup lang="ts">
import {services} from "~/composable/services";
import formValidation from "~/helpers/formValidation";
import {lengthRuleShort, phoneRule, requiredArrayRule, requiredRule} from "~/helpers/rules";
import {type IWorkshop, mapIWorkshop} from "~/models/workshop";
import type {Ref} from "vue";

definePageMeta({
  layout: 'company',
})

const {t} = useI18n()
const {form, valid, isValid} = formValidation()

const sharedStore = useSharedStore()
const {error} = storeToRefs(sharedStore)

const authStore = useAuthStore()
const {user, company} = storeToRefs(authStore)

const citiesJsonStore = useCitiesJsonStore()
const {citiesFromJson} = storeToRefs(citiesJsonStore)

const isEditing = ref(false)

const companyName = ref('')
const companyNip = ref('')
const companyCity = ref('')
const companyAddress = ref('')
const companyPhone = ref('')
const companyOpeningTime = ref(0)
const companyClosingTime = ref(0)
const companyServices: Ref<string[]> = ref([])

async function saveForm() {
  if (await isValid()) {
    await authStore.updateCompany(mapIWorkshop({
      address: companyAddress.value || "",
      city: companyCity.value || "",
      closingTime: companyClosingTime.value || 0,
      name: companyName.value || "",
      nip: companyNip.value || "",
      openingTime: companyOpeningTime.value || 0,
      phone: companyPhone.value || "",
      reference: company.value?.reference || "",
      services: companyServices.value || []
    }))
    isEditing.value = false
  }
}

function assignCompany(company: IWorkshop) {
  companyName.value = company.name
  companyPhone.value = company.phone
  companyAddress.value = company.address
  companyCity.value = company.city
  companyNip.value = company.nip
  companyServices.value = company.services
  companyClosingTime.value = company.closingTime
  companyOpeningTime.value = company.openingTime
}

onMounted(() => {
  if (!citiesFromJson.value.length)
    citiesJsonStore.getCitiesFromJson()
  if (company.value)
    assignCompany(company.value)
})

watch(company, (newValue) => {
  if (newValue && !citiesFromJson.value.length)
    citiesJsonStore.getCitiesFromJson()
  if (newValue)
    assignCompany(newValue)
})
</script>

<template>
  <v-container class="h-auto my-15">

    <v-sheet
        class="mx-auto my-10 pa-4"
        elevation="4"
        max-width="1100"
        rounded
    >
      <v-row justify="center" class="mt-5 mb-4 ">
        <div class="text-h5">
          {{ t('companyProfile.title') }}
        </div>
      </v-row>

      <v-divider/>

      <v-form
          v-model="valid"
          ref="form"
          @submit.prevent="saveForm"
          class="my-6 mx-4"
      >
        <v-row justify="center">
          <v-col cols="12" sm="12" md="12">
            <v-text-field
                v-model="companyName"
                :label="t('companyProfile.name')"
                :readonly="!isEditing"
                :rules="[requiredRule(t)]"
            />
          </v-col>

          <v-col cols="12" sm="12" md="6">
            <v-text-field
                v-model="companyNip"
                :label="t('companyProfile.nip')"
                :readonly="!isEditing"
                :rules="[requiredRule(t), lengthRuleShort(t)]"
            />
          </v-col>

          <v-col cols="12" sm="12" md="6">
            <v-text-field
                :model-value="user?.email || ''"
                :label="t('companyProfile.email')"
                readonly
                placeholder="example@mail.com"
            />
          </v-col>

          <v-col cols="12" sm="12" md="6">
            <v-select
                v-model="companyCity"
                :label="t('companyProfile.city')"
                :items="citiesFromJson"
                :readonly="!isEditing"
                :rules="[requiredRule(t), requiredArrayRule(t)]"
            />
          </v-col>

          <v-col cols="12" sm="12" md="6">
            <v-text-field
                v-model="companyAddress"
                :label="t('companyProfile.address')"
                :readonly="!isEditing"
                :rules="[requiredRule(t)]"
            />
          </v-col>

          <v-col cols="12" sm="12" md="6">
            <v-text-field
                v-model="companyPhone"
                :label="t('companyProfile.phone')"
                :readonly="!isEditing"
                type="number"
                :rules="[requiredRule(t), phoneRule(t)]"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="companyOpeningTime"
                :label="t('companyProfile.openingTime')"
                :readonly="!isEditing"
                type="number"
                :rules="[requiredRule(t)]"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="companyClosingTime"
                :label="t('companyProfile.closingTime')"
                :readonly="!isEditing"
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
                :readonly="!isEditing"
                :rules="[
                    requiredRule(t),
                    requiredArrayRule(t)
                ]"
            ></v-select>
          </v-col>
        </v-row>

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
              @click="saveForm"
          >
            {{ t('universal.save') }}
          </v-btn>
        </v-row>
      </v-form>
    </v-sheet>
  </v-container>

  <my-snackbar
      v-model="error"
      :text="t('universal.error')"
      :is-error="true"
  />

</template>

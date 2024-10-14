<script setup lang="ts">
import {services} from "~/composable/services";
import formValidation from "~/helpers/formValidation";
import {emailRule, lengthRuleShort, phoneRule, requiredArrayRule, requiredRule} from "~/helpers/rules";

definePageMeta({
  layout: 'company',
})

const {t} = useI18n()
const {form, valid, isValid} = formValidation()

const isEditing = ref(false)

const companyName = ref(null)
const companyNip = ref(null)
const companyEmail = ref(null)
const companyCity = ref(null)
const companyAddress = ref(null)
const companyPhone = ref(null)
const companyOpeningTime = ref(null)
const companyClosingTime = ref(null)
const companyServices = ref(null)

async function saveForm() {
  if (await isValid()) {


    isEditing.value = false
  }
}
</script>

<template>
  <v-container class="h-auto my-15">

    <v-sheet
        class="mx-auto my-10 pa-4"
        elevation="4"
        max-width="1100"
        rounded
    >
      <v-row justify="center">
        <div class="text-h5 my-5">
          {{ t('companyProfile.title') }}
        </div>
      </v-row>

      <v-form
          v-model="valid"
          ref="form"
          @submit.prevent="saveForm"
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
                v-model="companyEmail"
                :label="t('companyProfile.email')"
                :readonly="!isEditing"
                :rules="[requiredRule(t), emailRule(t)]"
                placeholder="example@mail.com"
            />
          </v-col>

          <v-col cols="12" sm="12" md="6">
            <v-select
                v-model="companyCity"
                :label="t('companyProfile.city')"
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

</template>

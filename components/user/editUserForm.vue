<script setup lang="ts">
import formValidation from "~/helpers/formValidation";
import {phoneRule, requiredRule} from "~/helpers/rules";

const isDialogShown = defineModel<boolean>()

const {t} = useI18n()

const {form, valid, isValid} = formValidation()

const userName = ref(null)
const userSurname = ref(null)
const userPhone = ref(null)

function resetState() {
  userName.value = null
  userSurname.value = null
  userPhone.value = null
}

function close() {
  resetState()
  isDialogShown.value = false
}

async function saveForm() {
  if (await isValid()) {

  }
}

</script>


<template>
  <v-dialog
      max-width="800px"
      :model-value="isDialogShown"
      scrollable
      @update:model-value="close">
    <v-card>
      <v-card-title>
        {{ t('userProfile.form.title') }}
      </v-card-title>

      <v-card-text>
        <v-form
            ref="form"
            class="my-2 mx-4"
            v-model="valid"
            @submit.prevent="saveForm"
        >
          <v-text-field
              v-model="userName"
              :label="t('userProfile.userName')"
              type="text"
              @keyup.enter="saveForm"
              :rules="[requiredRule(t)]"
          />

          <v-text-field
              v-model="userSurname"
              :label="t('userProfile.userSurname')"
              type="text"
              @keyup.enter="saveForm"
              :rules="[requiredRule(t)]"
          />

          <v-text-field
              v-model="userPhone"
              :label="t('userProfile.userPhone')"
              @keyup.enter="saveForm"
              type="number"
              :rules="[requiredRule(t), phoneRule(t)]"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn
            color="default"
            @click="close"
        >
          {{ t('universal.close') }}
        </v-btn>

        <v-btn
            color="secondary"
            @click="saveForm"
        >
          {{ t('universal.save') }}
        </v-btn>

      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
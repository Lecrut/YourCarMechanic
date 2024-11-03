<script setup lang="ts">
import {useAuthStore} from "~/stores/authStore";
import {storeToRefs} from "pinia";
import {emailRule, requiredRule} from "~/helpers/rules";
import formValidation from "~/helpers/formValidation";
import type {Ref} from "vue";

const {t} = useI18n()

const {form, valid, isValid} = formValidation()

const authStore = useAuthStore()
const {user, company} = storeToRefs(authStore)

const sharedStore = useSharedStore()
const {loading, error} = storeToRefs(sharedStore)

const emailSend: Ref<boolean> = ref(false)
const email = ref('')

async function resetPassword() {
  if (await isValid()) {
    await authStore.resetPassword(email.value)
  }
}

onMounted(() => {
  if (user.value) {
    user.value.role === "company" && company.value
        ? navigateTo('/company')
        : navigateTo('/user')
  }
  emailSend.value = false
})

watch(loading, (newLoading, oldLoading) => {
  if (!newLoading && oldLoading && !error.value)
    emailSend.value = true
  if (newLoading && !oldLoading)
    emailSend.value = false
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
        <v-col cols="12" sm="12" md="6" class="hidden-sm-and-down">
          <div class="d-flex flex-column align-center justify-center h-100 pa-6">
            <v-img
                class="mx-auto my-5 elevation-5"
                rounded="xl"
                :width="300"
                aspect-ratio="4/3"
                cover
                src="/reset.jpg"
            />
          </div>
        </v-col>
        <v-col cols="12" sm="12" md="6">
          <div class="d-flex flex-column align-center justify-center h-100 mx-2 py-4">
            <div class="text-h5 my-2">
              {{ t('resetPassword.title') }}
            </div>

            <p>{{ t('resetPassword.text') }}</p>

            <v-form
                class="w-75 my-2"
                v-model="valid"
                ref="form"
                @submit.prevent="resetPassword"
            >

              <v-text-field
                  v-model="email"
                  :label="t('resetPassword.email')"
                  placeholder="example@mail.com"
                  type="email"
                  :rules="[requiredRule(t), emailRule(t)]"
                  :disabled="loading"
              />

              <v-btn
                  class="mt-3"
                  :loading="loading"
                  @click="resetPassword"
              >
                {{ t('resetPassword.button') }}
              </v-btn>
            </v-form>
          </div>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>

  <my-snackbar
      v-model="error"
      :text="t('universal.error')"
      :is-error="true"
  />

  <my-snackbar
      v-model="emailSend"
      :text="t('resetPassword.sendSuccessfully')"
      :is-error="false"
  />

</template>

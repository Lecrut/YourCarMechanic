<script setup lang="ts">
import formValidation from "~/helpers/formValidation";
import {emailRule, requiredRule} from "~/helpers/rules";
import {useAuthStore} from "~/stores/authStore";
import {storeToRefs} from "pinia";

const {t} = useI18n()

const {form, valid, isValid} = formValidation()

const authStore = useAuthStore()
const {user, loginError} = storeToRefs(authStore)

const email = ref('')
const password = ref('')

const showPassword = ref(false)


async function logIn() {
  if (await isValid()) {
    await authStore.logIn(email.value, password.value)

    if (user.value?.role === 'user')
      navigateTo('/user')
    else if (user.value?.role === 'admin')
      navigateTo('/company')
    else if (user.value) {
      navigateTo('/auth/role-choice')
    }
  }
}

onMounted(() => {
  if (user.value) {
    user.value.role === "company" ? navigateTo('/company') : navigateTo('/user')
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
          <div class="d-flex flex-column align-center justify-center h-100 mb-5 py-5">
            <div class="text-h4 my-2">
              {{ t('login.title') }}
            </div>

            <v-form
                ref="form"
                @submit.prevent="logIn"
                class="w-75 my-2"
                v-model="valid"
            >
              <v-text-field
                  v-model="email"
                  :label="t('login.email')"
                  placeholder="example@mail.com"
                  type="email"
                  @keyup.enter="logIn"
                  :rules="[requiredRule(t), emailRule(t)]"
              />

              <v-text-field
                  class="mt-1"
                  v-model="password"
                  :label="t('login.password')"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword ? 'text' : 'password'"
                  @click:append-inner="showPassword = !showPassword"
                  @keyup.enter="logIn"
                  :rules="[requiredRule(t)]"
              />

              <v-row class="justify-center mt-2">
                <v-btn class="mx-2 mb-2" @click="logIn">
                  {{ t('login.button.login') }}
                </v-btn>

                <v-btn to="/auth/reset-password" class="mx-2 mb-2">
                  {{ t('login.button.resetPassword') }}
                </v-btn>
              </v-row>
            </v-form>

            <p class="my-5">
              {{ t('login.noAccount') }}
            </p>

            <v-btn to="/auth/register">
              {{ t('login.button.register') }}
            </v-btn>

            <my-snackbar
                v-model="loginError"
                :text="t('login.error')"
                :is-error="true"
            />
          </div>
        </v-col>
        <v-col cols="12" sm="12" md="6" class="hidden-sm-and-down">
          <div class="d-flex flex-column align-center justify-center h-100 pa-6">
            <v-img
                class="mx-auto my-5 elevation-5"
                rounded="xl"
                :max-width="400"
                :min-width="300"
                aspect-ratio="9/16"
                cover
                src="public/login.jpg"
            />
          </div>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>
</template>

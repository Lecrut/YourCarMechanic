<script setup lang="ts">
import formValidation from "~/helpers/formValidation";
import {emailRule, lengthRule, lengthRuleShort, passwordRule, requiredRule} from "~/helpers/rules";

const {t} = useI18n()

const {form, valid, isValid} = formValidation()

const email = ref('')
const name = ref('')
const password1 = ref('')
const password2 = ref('')
const rules = ref(false)

const showPasswordOne = ref(false)
const showPasswordTwo = ref(false)

async function registerUser() {
  if (await isValid()) {

  }
}

//todo: jeżeli zalogowany to od razu przenosi do index

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
                src="/register.jpg"
            />
          </div>
        </v-col>
        <v-col cols="12" sm="12" md="6">
          <div class="d-flex flex-column align-center justify-center h-100 py-4">
            <div class="text-h5 my-2">
              {{ t('register.title') }}
            </div>

            <v-form
                class="w-75 my-2"
                v-model="valid"
                ref="form"
                @submit.prevent="registerUser"
            >
              <v-text-field
                  v-model="email"
                  :label="t('register.email')"
                  placeholder="example@mail.com"
                  type="email"
                  @keyup.enter="registerUser"
                  :rules="[requiredRule(t), emailRule(t)]"
              />

              <v-text-field
                  v-model="name"
                  :label="t('register.userName')"
                  type="text"
                  @keyup.enter="registerUser"
                  :rules="[requiredRule(t), lengthRuleShort(t), lengthRule(t)]"
              />

              <v-text-field
                  v-model="password1"
                  :label="t('register.password')"
                  @keyup.enter="registerUser"
                  :append-inner-icon="showPasswordOne ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPasswordOne ? 'text' : 'password'"
                  @click:append-inner="showPasswordOne = !showPasswordOne"
                  :rules="[requiredRule(t), passwordRule(t)]"
              />

              <v-text-field
                  v-model="password2"
                  :label="t('register.repeatPassword')"
                  @keyup.enter="registerUser"
                  :append-inner-icon="showPasswordTwo ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPasswordTwo ? 'text' : 'password'"
                  @click:append-inner="showPasswordTwo = !showPasswordTwo"
                  :rules="[requiredRule(t), passwordRule(t)]"
              />

              <v-checkbox
                  v-model="rules"
                  :label="t('register.acceptStatute')"
                  :rules="[requiredRule(t)]"
              />

              <v-btn @click="registerUser">
                {{ t('register.button') }}
              </v-btn>
            </v-form>

            <!--          <v-alert-->
            <!--              v-if="registerError"-->
            <!--              color="error"-->
            <!--              variant="tonal"-->
            <!--              class="my-4"-->
            <!--          >-->
            <!--            Niepoprawne dane rejestracji-->
            <!--          </v-alert>-->
          </div>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>
</template>

<style scoped>

</style>
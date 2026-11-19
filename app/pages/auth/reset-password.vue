<script setup lang="ts">
import formValidation from '~/utils/formValidation'
import { emailRule, requiredRule } from '~/utils/rules'
import AuthCard from '~/components/authCard.vue'

definePageMeta({ middleware: ['guest'] })

const { t } = useI18n()
const { form, valid, isValid } = formValidation()

const authStore = useAuthStore()
const sharedStore = useSharedStore()
const { loading, error } = storeToRefs(sharedStore)

const email = ref('')
const emailSent = ref(false)

async function resetPassword() {
  if (!(await isValid())) return
  emailSent.value = false
  await authStore.resetPassword(email.value)
  emailSent.value = !error.value
}

onMounted(() => sharedStore.resetState())
</script>

<template>
  <auth-card
    :title="t('resetPassword.title')"
    image="/reset.webp"
    image-first
  >
    <p class="text-body-medium text-center mb-6">
      {{ t('resetPassword.text') }}
    </p>

    <v-expand-transition>
      <v-alert
        v-if="emailSent"
        type="success"
        variant="tonal"
        class="mb-4"
        :text="t('resetPassword.sendSuccessfully')"
      />
    </v-expand-transition>

    <v-form
      ref="form"
      v-model="valid"
      :disabled="loading"
      @submit.prevent="resetPassword"
    >
      <v-text-field
        v-model="email"
        :label="t('resetPassword.email')"
        placeholder="example@mail.com"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        :rules="[requiredRule(t), emailRule(t)]"
      />

      <v-btn
        type="submit"
        block
        size="large"
        class="mt-2"
        :loading="loading"
      >
        {{ t('resetPassword.button') }}
      </v-btn>
    </v-form>

    <v-btn
      to="/auth/login"
      variant="text"
      block
      class="mt-4"
      prepend-icon="mdi-arrow-left"
    >
      {{ t('navBar.login') }}
    </v-btn>
  </auth-card>
</template>

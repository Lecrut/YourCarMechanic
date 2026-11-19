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
const password = ref('')
const showPassword = ref(false)

async function logIn() {
  if (!(await isValid())) return
  await authStore.logIn(email.value, password.value)
  if (authStore.user) await navigateTo(authStore.homePath)
}

onMounted(() => sharedStore.resetState())
</script>

<template>
  <auth-card
    :title="t('login.title')"
    image="/login.jpg"
  >
    <v-form
      ref="form"
      v-model="valid"
      :disabled="loading"
      @submit.prevent="logIn"
    >
      <v-text-field
        v-model="email"
        :label="t('login.email')"
        placeholder="example@mail.com"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        autocomplete="email"
        :rules="[requiredRule(t), emailRule(t)]"
        data-testid="email"
      />

      <v-text-field
        v-model="password"
        class="mt-2"
        :label="t('login.password')"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        :rules="[requiredRule(t)]"
        data-testid="password"
        @click:append-inner="showPassword = !showPassword"
      />

      <div class="text-end mb-4">
        <v-btn
          to="/auth/reset-password"
          variant="text"
          size="small"
        >
          {{ t('login.button.resetPassword') }}
        </v-btn>
      </div>

      <v-btn
        type="submit"
        block
        size="large"
        :loading="loading"
        data-testid="submit"
      >
        {{ t('login.button.login') }}
      </v-btn>
    </v-form>

    <v-divider class="my-6" />

    <p class="text-center text-body-medium mb-3">
      {{ t('login.noAccount') }}
    </p>
    <v-btn
      to="/auth/register"
      variant="tonal"
      block
      :disabled="loading"
    >
      {{ t('login.button.register') }}
    </v-btn>

    <my-snackbar
      v-model="error"
      :text="t('login.error')"
      :is-error="true"
    />
  </auth-card>
</template>

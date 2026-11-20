<script setup lang="ts">
import formValidation from '~/utils/formValidation'
import { emailRule, requiredRule } from '~/utils/rules'
import AuthCard from '~/components/account/authCard.vue'

definePageMeta({ middleware: ['guest'] })

const { t } = useI18n()
const { form, valid, isValid } = formValidation()

const authStore = useAuthStore()
const route = useRoute()
const sharedStore = useSharedStore()
const { loading } = storeToRefs(sharedStore)

const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function logIn() {
  if (!(await isValid())) return
  await authStore.logIn(email.value, password.value)
  if (!authStore.user) return
  // Only same-site paths; users without a role finish registration first (homePath = role choice).
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  const safe = redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/auth')
  await navigateTo(safe && authStore.role ? redirect : authStore.homePath)
}

onMounted(() => sharedStore.resetState())
</script>

<template>
  <auth-card
    :title="t('login.title')"
    image="/login.webp"
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

      <div class="d-flex justify-center">
        <v-btn
          type="submit"
          class="px-8"
          :loading="loading"
          data-testid="submit"
        >
          {{ t('login.button.login') }}
        </v-btn>
      </div>
    </v-form>

    <v-divider class="my-6" />

    <p class="text-center text-body-medium mb-3">
      {{ t('login.noAccount') }}
    </p>
    <div class="d-flex justify-center">
      <v-btn
        to="/auth/register"
        variant="tonal"
        class="px-6"
        :disabled="loading"
      >
        {{ t('login.button.register') }}
      </v-btn>
    </div>
  </auth-card>
</template>

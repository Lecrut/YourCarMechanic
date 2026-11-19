<script setup lang="ts">
import formValidation from '~/utils/formValidation'
import { emailRule, passwordRule, requiredRule } from '~/utils/rules'
import AuthCard from '~/components/authCard.vue'

definePageMeta({ middleware: ['guest'] })

const { t } = useI18n()
const { form, valid, isValid } = formValidation()

const authStore = useAuthStore()
const sharedStore = useSharedStore()
const { loading } = storeToRefs(sharedStore)

const email = ref('')
const password1 = ref('')
const password2 = ref('')
const acceptedTerms = ref(false)
const showPassword = ref(false)

const passwordsMatch = () => password1.value === password2.value || t('rules.passwordsMustMatch')

async function registerUser() {
  if (!(await isValid())) return
  await authStore.signUp(email.value, password1.value, password2.value)
  if (authStore.user) await navigateTo('/auth/role-choice')
}

onMounted(() => sharedStore.resetState())
</script>

<template>
  <auth-card
    :title="t('register.title')"
    image="/register.webp"
    image-first
  >
    <v-form
      ref="form"
      v-model="valid"
      :disabled="loading"
      @submit.prevent="registerUser"
    >
      <v-text-field
        v-model="email"
        :label="t('register.email')"
        placeholder="example@mail.com"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        autocomplete="email"
        :rules="[requiredRule(t), emailRule(t)]"
        data-testid="email"
      />

      <v-text-field
        v-model="password1"
        class="mt-2"
        :label="t('register.password')"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        :hint="t('rules.passwordRule')"
        :rules="[requiredRule(t), passwordRule(t)]"
        data-testid="password"
        @click:append-inner="showPassword = !showPassword"
      />

      <v-text-field
        v-model="password2"
        class="mt-2"
        :label="t('register.repeatPassword')"
        prepend-inner-icon="mdi-lock-check-outline"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        :rules="[requiredRule(t), passwordsMatch]"
        data-testid="password-repeat"
      />

      <v-checkbox
        v-model="acceptedTerms"
        color="primary"
        :rules="[requiredRule(t)]"
        data-testid="terms"
      >
        <template #label>
          {{ t('register.acceptStatute') }}&nbsp;
          <a
            href="/Regulamin_Twoj_Mechanik.pdf"
            target="_blank"
            class="text-primary font-weight-bold text-decoration-none"
            @click.stop
          >
            {{ t('register.statute') }}
          </a>
        </template>
      </v-checkbox>

      <v-btn
        type="submit"
        block
        size="large"
        :loading="loading"
        data-testid="submit"
      >
        {{ t('register.button') }}
      </v-btn>
    </v-form>

    <v-divider class="my-6" />

    <v-btn
      to="/auth/login"
      variant="tonal"
      block
      :disabled="loading"
    >
      {{ t('register.haveAccount') }}
    </v-btn>
  </auth-card>
</template>

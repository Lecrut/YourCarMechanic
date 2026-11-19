<script setup lang="ts">
/** Reminds signed-in users to confirm their e-mail (the link is sent on sign-up). */
const { t } = useI18n()
const authStore = useAuthStore()
const { user, emailVerified } = storeToRefs(authStore)

const sent = ref(false)

async function resend() {
  await authStore.resendVerification()
  sent.value = true
}

watch(() => user.value?.reference, (ref) => {
  if (ref) authStore.checkEmailVerified()
}, { immediate: true })
</script>

<template>
  <v-expand-transition>
    <v-alert
      v-if="user && emailVerified === false"
      type="warning"
      variant="tonal"
      density="compact"
      rounded="0"
      icon="mdi-email-alert-outline"
      data-testid="verify-email-banner"
    >
      <div class="d-flex align-center flex-wrap ga-2">
        <span>{{ t('account.verifyEmail', { email: user.email }) }}</span>
        <v-spacer />
        <v-btn
          size="small"
          variant="text"
          :disabled="sent"
          data-testid="resend-verification"
          @click="resend"
        >
          {{ sent ? t('account.verificationSent') : t('account.resend') }}
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          @click="authStore.checkEmailVerified()"
        >
          {{ t('account.alreadyVerified') }}
        </v-btn>
      </div>
    </v-alert>
  </v-expand-transition>
</template>

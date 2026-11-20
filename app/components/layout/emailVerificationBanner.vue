<script setup lang="ts">
/** Reminds signed-in users to confirm their e-mail (the link is sent on sign-up). */
const { t } = useI18n()
const authStore = useAuthStore()
const { user, emailVerified } = storeToRefs(authStore)

const sent = ref(false)
const checking = ref(false)
const notYetVerified = ref(false)

async function resend() {
  await authStore.resendVerification()
  sent.value = true
}

async function verifyNow() {
  checking.value = true
  notYetVerified.value = false
  try {
    await authStore.checkEmailVerified()
    if (emailVerified.value === false) notYetVerified.value = true
  }
  finally {
    checking.value = false
  }
}

watch(() => user.value?.reference, (userRef) => {
  if (userRef) authStore.checkEmailVerified()
}, { immediate: true })
</script>

<template>
  <div class="flex-shrink-0">
    <v-expand-transition>
      <v-alert
        v-if="user && emailVerified === false"
        type="warning"
        variant="tonal"
        density="comfortable"
        rounded="xl"
        class="mx-4 mt-4"
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
            :loading="checking"
            data-testid="check-verification"
            @click="verifyNow"
          >
            {{ t('account.alreadyVerified') }}
          </v-btn>
        </div>
        <div
          v-if="notYetVerified"
          class="text-body-small mt-1"
        >
          {{ t('account.notYetVerified') }}
        </div>
      </v-alert>
    </v-expand-transition>
  </div>
</template>

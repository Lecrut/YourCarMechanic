import type { FirebaseOptions } from 'firebase/app'
import { authService, initFirebase } from '~/services'

export default defineNuxtPlugin({
  name: 'firebase',
  setup() {
    const config = useRuntimeConfig().public
    initFirebase(config.firebase as FirebaseOptions, Boolean(config.useEmulators))

    // Firebase Auth is the source of truth for the session:
    // - signed in  -> keep the cached profile live (role/company changes made by a moderator)
    // - signed out -> drop the cached user (sign-out in another tab, revoked or expired session)
    const authStore = useAuthStore()
    authService.onAuthChange((uid) => {
      if (uid) authStore.startSession(uid)
      else if (authStore.user) authStore.clearSession()
    })
  },
})

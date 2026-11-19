import { authService } from '~/services'

/**
 * Requires a signed-in user; with `definePageMeta({ role })` also the right role.
 * Firebase Auth decides whether there is a session – the persisted store is only a cache.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!(await authService.isSignedIn())) {
    authStore.clearSession()
    return navigateTo('/auth/login')
  }
  // Signed in, but the local cache is gone (cleared storage, new tab) – restore it instead of logging out.
  if (!authStore.user && !(await authStore.restoreSession())) {
    authStore.clearSession()
    return navigateTo('/auth/login')
  }

  const allowed = to.meta.role ? [to.meta.role].flat() : null
  if (allowed && (!authStore.role || !allowed.includes(authStore.role)))
    return navigateTo(authStore.homePath)
})

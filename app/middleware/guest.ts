/** Auth pages: a signed-in user is sent to their home page. */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (authStore.user?.role) return navigateTo(authStore.homePath)
})

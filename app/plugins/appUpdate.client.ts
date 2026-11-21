/** Nuxt periodically compares the running build with the deployed one; a mismatch shows the reload banner. */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hook('app:manifest:update', () => {
    useSharedStore().updateAvailable = true
  })
})

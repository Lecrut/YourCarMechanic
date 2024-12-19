export default defineNuxtRouteMiddleware(async () => {
    const authStore = useAuthStore()

    const {user, company} = storeToRefs(authStore)

    if (!user.value && !company.value)
        return navigateTo('/')
})

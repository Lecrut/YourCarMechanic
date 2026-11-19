import { authService, workshopsService } from '~/services'
import type { IUser } from '~/models/user'
import type { IUserProfile } from '~/models/userProfile'
import type { IWorkshop } from '~/models/workshop'
import { createSubscription } from '~/utils/subscription'
import { AppError } from '~/utils/errors'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<IUser | null>(null)
  const company = ref<IWorkshop | null>(null)
  /** null = not checked yet. */
  const emailVerified = ref<boolean | null>(null)

  const sharedStore = useSharedStore()
  const userSubscription = createSubscription()
  const companySubscription = createSubscription()

  const role = computed(() => user.value?.role ?? null)
  const uid = computed(() => user.value?.reference.split('/').pop() ?? '')

  /** Where a signed-in user should land. */
  const homePath = computed(() => {
    switch (role.value) {
      case 'user': return '/user'
      case 'workshop': return company.value ? '/company' : '/auth/role-choice'
      case 'moderator': return '/moderator'
      default: return '/auth/role-choice'
    }
  })

  function watchCompany(companyRef: string | null) {
    if (!companyRef) {
      companySubscription.stop()
      company.value = null
      return
    }
    companySubscription.start(() => workshopsService.watchWorkshop(companyRef, (w) => {
      company.value = w
    }))
  }

  /**
   * Keeps `user` (and the owned company) in sync with Firestore for the whole session.
   * Called by the Firebase plugin whenever Firebase Auth reports a signed-in user.
   */
  function startSession(authUid: string) {
    userSubscription.start(() => authService.watchUser(authUid, (u) => {
      user.value = u
      watchCompany(u?.role === 'workshop' ? u.companyRef : null)
    }))
  }

  function resetState() {
    userSubscription.stop()
    companySubscription.stop()
    user.value = null
    company.value = null
    emailVerified.value = null
  }

  /** Clears every user-scoped store. Also called when Firebase reports the session ended. */
  function clearSession() {
    sharedStore.resetState()
    useCarsStore().resetState()
    useFixesStore().resetState()
    useWorkshopStore().resetState()
    useModeratorStore().resetState()
    usePricingStore().resetState()
    useClientsStore().resetState()
    useFeedStore().stop()
    resetState()
  }

  async function setUser(newUser: IUser) {
    user.value = newUser
    company.value = newUser.role === 'workshop' && newUser.companyRef
      ? await workshopsService.getWorkshop(newUser.companyRef)
      : null
  }

  /** Loads the signed-in user's profile when the cached one is missing. Returns success. */
  async function restoreSession(): Promise<boolean> {
    try {
      const restored = await authService.loadCurrentUser()
      if (restored) await setUser(restored)
      return Boolean(restored)
    }
    catch (e) {
      sharedStore.fail(e)
      return false
    }
  }

  const logIn = (email: string, password: string) =>
    sharedStore.run(async () => setUser(await authService.logIn(email, password)))

  async function signUp(email: string, password1: string, password2: string) {
    if (password1 !== password2) {
      sharedStore.fail(new AppError('rules.passwordsMustMatch'))
      return
    }
    await sharedStore.run(async () => setUser(await authService.signUp(email, password1)))
  }

  async function logOut() {
    await authService.logOut()
    clearSession()
  }

  const resetPassword = (email: string) => sharedStore.run(() => authService.resetPassword(email))

  async function checkEmailVerified() {
    try {
      emailVerified.value = await authService.isEmailVerified()
    }
    catch (e) {
      console.error(e)
    }
  }

  const resendVerification = () => sharedStore.run(() => authService.resendVerification())

  const updateUserProfile = (profile: IUserProfile) =>
    sharedStore.run(async () => {
      if (!user.value) throw new AppError('errors.notSignedIn')
      user.value = await authService.updateProfile(user.value.reference, profile, user.value.role)
    })

  const createCompany = (workshop: IWorkshop) =>
    sharedStore.run(async () => {
      if (!user.value) throw new AppError('errors.notSignedIn')
      const created = await workshopsService.addWorkshop(workshop, uid.value)
      user.value = await authService.setWorkshopOwner(user.value.reference, created.reference)
      company.value = created
    })

  const updateCompany = (workshop: IWorkshop) =>
    sharedStore.run(async () => {
      company.value = await workshopsService.updateWorkshop(workshop)
    })

  return {
    user,
    company,
    role,
    homePath,
    startSession,
    restoreSession,
    emailVerified,
    checkEmailVerified,
    resendVerification,
    logIn,
    signUp,
    logOut,
    clearSession,
    resetPassword,
    resetState,
    updateUserProfile,
    createCompany,
    updateCompany,
  }
}, {
  // Remembered in localStorage between visits. Only a cache – Firebase Auth is the source of truth
  // (plugins/firebase.client.ts clears it when the session ends).
  persist: { pick: ['user', 'company'] },
})

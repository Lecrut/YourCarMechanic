import { fixesService, moderatorService, workshopsService } from '~/services'
import type { IUser, UserRole } from '~/models/user'
import type { IWorkshop, WorkshopStatus } from '~/models/workshop'
import type { IFix } from '~/models/fix'
import type { ICar } from '~/models/car'
import type { INotification } from '~/models/notification'
import { createSubscription } from '~/utils/subscription'

export const useModeratorStore = defineStore('moderator', () => {
  const users = ref<IUser[]>([])
  const workshops = ref<IWorkshop[]>([])
  const fixes = ref<IFix[]>([])
  const cars = ref<ICar[]>([])

  const sharedStore = useSharedStore()
  const { t } = useI18n()
  const subscription = createSubscription()

  function stopWatching() {
    subscription.stop()
  }

  function resetState() {
    stopWatching()
    users.value = []
    workshops.value = []
    fixes.value = []
    cars.value = []
  }

  function watchAll() {
    subscription.start(() => moderatorService.watchAll({
      onUsers: list => (users.value = list),
      onWorkshops: list => (workshops.value = list),
      onFixes: list => (fixes.value = list),
      onCars: list => (cars.value = list),
      onError: e => sharedStore.fail(e),
    }))
  }

  const loadAll = () =>
    sharedStore.run(async () => {
      [users.value, workshops.value, fixes.value, cars.value] = await Promise.all([
        moderatorService.getAllUsers(),
        moderatorService.getAllWorkshops(),
        moderatorService.getAllFixes(),
        moderatorService.getAllCars(),
      ])
    })

  const updateWorkshop = (workshop: IWorkshop) =>
    sharedStore.run(async () => {
      const updated = await workshopsService.updateWorkshop(workshop)
      workshops.value = workshops.value.map(w => (w.reference === updated.reference ? updated : w))
    })

  const deleteWorkshop = (workshop: IWorkshop) =>
    sharedStore.run(async () => {
      await moderatorService.cancelOpenFixes(workshop.reference, t('moderator.cancelReasonRemoved', { name: workshop.name }))
      await moderatorService.deleteWorkshop(workshop.reference)
      workshops.value = workshops.value.map(w => (w.reference === workshop.reference ? { ...w, deletedAt: new Date() } : w))
    })

  const restoreWorkshop = (workshop: IWorkshop) =>
    sharedStore.run(async () => {
      await moderatorService.restoreWorkshop(workshop.reference)
      workshops.value = workshops.value.map(w => (w.reference === workshop.reference ? { ...w, deletedAt: null } : w))
    })

  const setWorkshopStatus = (workshop: IWorkshop, status: WorkshopStatus) =>
    sharedStore.run(async () => {
      // Visits at a suspended workshop cannot happen – cancel them and tell the clients why.
      if (status === 'suspended')
        await moderatorService.cancelOpenFixes(workshop.reference, t('moderator.cancelReasonSuspended', { name: workshop.name }))
      await moderatorService.setWorkshopStatus(workshop.reference, status)
      const contractSignedAt = status === 'approved' ? new Date() : workshop.contractSignedAt
      workshops.value = workshops.value.map(w => (w.reference === workshop.reference ? { ...w, status, contractSignedAt } : w))
    })

  const createWorkshop = (workshop: IWorkshop, owner: IUser | null, ownerEmail?: string | null) =>
    sharedStore.run(async () => {
      const created = await moderatorService.createWorkshop(workshop, owner, ownerEmail)
      workshops.value = [...workshops.value, created]
      if (owner) {
        users.value = users.value.map(u => (u.reference === owner.reference
          ? { ...u, role: 'workshop' as const, companyRef: created.reference }
          : u))
      }
      else if (ownerEmail?.trim()) {
        users.value = await moderatorService.getAllUsers()
      }
    })

  /** Moderator intervention on any repair (status, note or cancellation). */
  const addNotification = (fix: IFix, notification: INotification) =>
    sharedStore.run(async () => {
      const updated = await fixesService.addNotification(fix, notification)
      fixes.value = fixes.value.map(f => (f.reference === updated.reference ? updated : f))
      return updated
    })

  /** Open (not closed) visits of a workshop – shown before suspending or removing it. */
  const openVisitsOf = (workshop: IWorkshop) => fixes.value.filter(f => f.companyRef === workshop.reference && !f.isClosed).length

  const pendingWorkshops = computed(() => workshops.value.filter(w => !w.deletedAt && w.status === 'pending'))

  const setUserRole = (user: IUser, role: UserRole | null) =>
    sharedStore.run(async () => {
      await moderatorService.setUserRole(user.reference, role)
      users.value = users.value.map(u => (u.reference === user.reference ? { ...u, role } : u))
    })

  const workshopName = (companyRef: string) =>
    workshops.value.find(w => w.reference === companyRef)?.name || t('moderator.unknownCompany')

  const userEmail = (userRef: string) =>
    users.value.find(u => u.reference === userRef)?.email || t('moderator.unknownUser')

  return {
    users,
    workshops,
    fixes,
    cars,
    resetState,
    watchAll,
    stopWatching,
    loadAll,
    updateWorkshop,
    deleteWorkshop,
    restoreWorkshop,
    setWorkshopStatus,
    createWorkshop,
    pendingWorkshops,
    openVisitsOf,
    addNotification,
    setUserRole,
    workshopName,
    userEmail,
  }
})

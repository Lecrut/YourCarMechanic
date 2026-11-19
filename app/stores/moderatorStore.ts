import { fixesService, moderatorService, workshopsService } from '~/services'
import type { IUser, UserRole } from '~/models/user'
import type { IWorkshop, WorkshopStatus } from '~/models/workshop'
import type { IFix } from '~/models/fix'
import type { ICar } from '~/models/car'
import type { INotification } from '~/models/notification'

export const useModeratorStore = defineStore('moderator', () => {
  const users = ref<IUser[]>([])
  const workshops = ref<IWorkshop[]>([])
  const fixes = ref<IFix[]>([])
  const cars = ref<ICar[]>([])

  const sharedStore = useSharedStore()

  function resetState() {
    users.value = []
    workshops.value = []
    fixes.value = []
    cars.value = []
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
      await moderatorService.setWorkshopStatus(workshop.reference, status)
      const contractSignedAt = status === 'approved' ? new Date() : workshop.contractSignedAt
      workshops.value = workshops.value.map(w => (w.reference === workshop.reference ? { ...w, status, contractSignedAt } : w))
    })

  const createWorkshop = (workshop: IWorkshop, owner: IUser | null) =>
    sharedStore.run(async () => {
      const created = await moderatorService.createWorkshop(workshop, owner)
      workshops.value = [...workshops.value, created]
      if (owner) {
        users.value = users.value.map(u => (u.reference === owner.reference
          ? { ...u, role: 'workshop' as const, companyRef: created.reference }
          : u))
      }
    })

  /** Moderator intervention on any repair (status, note or cancellation). */
  const addNotification = (fix: IFix, notification: INotification) =>
    sharedStore.run(async () => {
      const updated = await fixesService.addNotification(fix, notification)
      fixes.value = fixes.value.map(f => (f.reference === updated.reference ? updated : f))
      return updated
    })

  const pendingWorkshops = computed(() => workshops.value.filter(w => w.status === 'pending'))

  const setUserRole = (user: IUser, role: UserRole | null) =>
    sharedStore.run(async () => {
      await moderatorService.setUserRole(user.reference, role)
      users.value = users.value.map(u => (u.reference === user.reference ? { ...u, role } : u))
    })

  const workshopName = (companyRef: string) =>
    workshops.value.find(w => w.reference === companyRef)?.name ?? companyRef

  const userEmail = (userRef: string) =>
    users.value.find(u => u.reference === userRef)?.email ?? userRef

  return {
    users,
    workshops,
    fixes,
    cars,
    resetState,
    loadAll,
    updateWorkshop,
    deleteWorkshop,
    restoreWorkshop,
    setWorkshopStatus,
    createWorkshop,
    pendingWorkshops,
    addNotification,
    setUserRole,
    workshopName,
    userEmail,
  }
})

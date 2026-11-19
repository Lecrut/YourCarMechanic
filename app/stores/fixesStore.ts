import { fixesService } from '~/services'
import type { IFix, IFixProposal } from '~/models/fix'
import type { INotification } from '~/models/notification'
import { createSubscription } from '~/utils/subscription'

export const useFixesStore = defineStore('fixes', () => {
  const fixes = ref<IFix[]>([])
  const historyFixes = ref<IFix[]>([])
  const watching = ref(false)

  const sharedStore = useSharedStore()
  const activeSubscription = createSubscription()

  /** Live list of active fixes for a client (`userRef`) or a workshop (`companyRef`). */
  function watchActive(field: 'userRef' | 'companyRef', ref: string) {
    watching.value = true
    activeSubscription.start(() => fixesService.watchActiveFixes(
      field,
      ref,
      (list) => {
        fixes.value = list
        watching.value = false
      },
      (e) => {
        sharedStore.fail(e)
        watching.value = false
      },
    ))
  }

  function stopWatching() {
    activeSubscription.stop()
    watching.value = false
  }

  function resetState() {
    stopWatching()
    fixes.value = []
    historyFixes.value = []
  }

  const getUserHistoryFixes = (userRef: string) =>
    sharedStore.run(async () => {
      historyFixes.value = await fixesService.getUserClosedFixes(userRef)
    })

  const getWorkshopHistoryFixes = (companyRef: string) =>
    sharedStore.run(async () => {
      historyFixes.value = await fixesService.getWorkshopClosedFixes(companyRef)
    })

  /** The live listener picks the new fix up; no manual list update needed. */
  const addFix = (fix: IFix) => sharedStore.run(() => fixesService.addFix(fix))

  /** Adds a status. Active lists refresh through the listener; history is patched locally. */
  const addNotification = (fix: IFix, notification: INotification) =>
    sharedStore.run(async () => {
      const updated = await fixesService.addNotification(fix, notification)
      if (updated.isClosed) historyFixes.value = [updated, ...historyFixes.value]
      return updated
    })

  // Proposal flow – active lists update through the live listener.
  const proposeChange = (fix: IFix, proposal: Omit<IFixProposal, 'createdAt'>, note: string) =>
    sharedStore.run(() => fixesService.proposeChange(fix, proposal, note))
  const acceptProposal = (fix: IFix) => sharedStore.run(() => fixesService.acceptProposal(fix))
  const rejectProposal = (fix: IFix) => sharedStore.run(() => fixesService.rejectProposal(fix))
  const confirmBooking = (fix: IFix) => sharedStore.run(() => fixesService.confirmBooking(fix))

  /** Local patch after a review was saved (history is not live). */
  function markReviewed(fixRef: string) {
    historyFixes.value = historyFixes.value.map(f => (f.reference === fixRef ? { ...f, reviewed: true } : f))
  }

  return {
    fixes,
    historyFixes,
    watching,
    watchActive,
    stopWatching,
    getUserHistoryFixes,
    getWorkshopHistoryFixes,
    addFix,
    addNotification,
    proposeChange,
    acceptProposal,
    rejectProposal,
    confirmBooking,
    markReviewed,
    resetState,
  }
})

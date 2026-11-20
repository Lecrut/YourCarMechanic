import { fixesService, photosService } from '~/services'
import { downscaleImage } from '~/utils/image'
import { AppError } from '~/utils/errors'
import { type IFix, type IFixPhoto, type IFixProposal, MAX_PHOTOS } from '~/models/fix'
import type { INotification } from '~/models/notification'
import { createSubscription } from '~/utils/subscription'

export const useFixesStore = defineStore('fixes', () => {
  const fixes = ref<IFix[]>([])
  const historyFixes = ref<IFix[]>([])
  const watching = ref(false)

  const sharedStore = useSharedStore()
  const activeSubscription = createSubscription()

  /** Live list of active fixes for a client (`userRef`) or a workshop (`companyRef`). */
  function watchActive(field: 'userRef' | 'companyRef', ownerRef: string) {
    watching.value = true
    activeSubscription.start(() => fixesService.watchActiveFixes(
      field,
      ownerRef,
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
  /** Client moves the visit; the live listener shows the new time. */
  const reschedule = (fix: IFix, date: Date) => sharedStore.run(() => fixesService.rescheduleByClient(fix, date))

  /** Downscales and uploads photos one by one; the live listener shows them on the fix. */
  const addPhotos = (fix: IFix, files: File[], by: IFixPhoto['by']) =>
    sharedStore.run(async () => {
      if (fix.photos.length + files.length > MAX_PHOTOS) throw new AppError('errors.tooManyPhotos')
      for (const file of files) {
        if (!file.type.startsWith('image/')) throw new AppError('errors.notAnImage')
        await photosService.uploadPhoto(fix, await downscaleImage(file), by)
      }
    })

  /** All repairs of the customer (car history). */
  const getAllUserFixes = (userRef: string) => sharedStore.run(() => fixesService.getAllUserFixes(userRef))

  // Notes – the public one updates through the live listener, the internal one is read on demand.
  const setPublicNote = (fix: IFix, text: string) => sharedStore.run(() => fixesService.setPublicNote(fix, text))
  const getInternalNote = (fixRef: string) => sharedStore.run(() => fixesService.getInternalNote(fixRef))
  const setInternalNote = (fixRef: string, text: string) => sharedStore.run(() => fixesService.setInternalNote(fixRef, text))

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
    reschedule,
    setPublicNote,
    addPhotos,
    getAllUserFixes,
    getInternalNote,
    setInternalNote,
    markReviewed,
    resetState,
  }
})

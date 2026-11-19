import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { AppError } from '~/utils/errors'
import { fromDoc, fromQuery } from './mappers'
import { type IFix, type IFixProposal, mapIFix } from '~/models/fix'
import { mapICarToFirebase } from '~/models/car'
import {
  CLOSING_NOTIFICATIONS,
  type INotification,
  mapINotification,
  mapINotificationToFirebase,
  type NotificationType,
} from '~/models/notification'

const fixes = () => collection(db(), 'fixes')

/**
 * One document per booked hour: `companies/{id}/slots/{ISO date}`.
 * Clients check availability here instead of reading other customers' fixes.
 */
const slotDoc = (companyRef: string, date: Date) => doc(db(), `${companyRef}/slots/${date.toISOString()}`)

const statusEntry = (notificationType: NotificationType, description = '') =>
  mapINotificationToFirebase(mapINotification({ notificationType, description }))

async function readFix(reference: string, fallback: IFix): Promise<IFix> {
  return mapIFix(fromDoc<IFix>(await getDoc(doc(db(), reference))) ?? fallback)
}

async function listFixes(field: 'userRef' | 'companyRef', ownerRef: string, closed: boolean): Promise<IFix[]> {
  const snap = await getDocs(query(fixes(), where(field, '==', ownerRef), where('isClosed', '==', closed)))
  return fromQuery<IFix>(snap).map(mapIFix).sort((a, b) => a.date.getTime() - b.date.getTime())
}

// History changes rarely and only by the viewer -> one-off reads.
export const getUserClosedFixes = (userRef: string) => listFixes('userRef', userRef, true)
export const getWorkshopClosedFixes = (companyRef: string) => listFixes('companyRef', companyRef, true)

/** Every fix of a workshop (open and closed) – source of its client list. */
export async function getAllWorkshopFixes(companyRef: string): Promise<IFix[]> {
  return fromQuery<IFix>(await getDocs(query(fixes(), where('companyRef', '==', companyRef)))).map(mapIFix)
}

/**
 * Active fixes are edited by the *other* party (workshop adds statuses, client books/cancels/accepts),
 * so they are watched in real time. Returns the unsubscribe function.
 */
export function watchActiveFixes(
  field: 'userRef' | 'companyRef',
  ownerRef: string,
  onChange: (fixes: IFix[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(fixes(), where(field, '==', ownerRef), where('isClosed', '==', false)),
    snap => onChange(fromQuery<IFix>(snap).map(mapIFix).sort((a, b) => a.date.getTime() - b.date.getTime())),
    onError,
  )
}

/**
 * Repairs of the last weeks (open and closed) for the notification feed, watched live.
 * Needs the composite indexes in firestore.indexes.json.
 */
export function watchRecentFixes(
  field: 'userRef' | 'companyRef',
  ownerRef: string,
  since: Date,
  onChange: (fixes: IFix[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(fixes(), where(field, '==', ownerRef), where('date', '>=', Timestamp.fromDate(since))),
    snap => onChange(fromQuery<IFix>(snap).map(mapIFix)),
    onError,
  )
}

/**
 * Creates the fix and reserves its slot atomically – fails if the hour was taken in the meantime.
 * Workshop-created fixes (`createdBy: 'workshop'`) start unconfirmed until the client accepts.
 */
export async function addFix(fix: IFix): Promise<IFix> {
  const fixRef = doc(fixes())
  const slotRef = slotDoc(fix.companyRef, fix.date)
  const byWorkshop = fix.createdBy === 'workshop'

  await runTransaction(db(), async (tx) => {
    if ((await tx.get(slotRef)).exists()) throw new AppError('errors.slotTaken')

    tx.set(slotRef, {
      date: Timestamp.fromDate(fix.date),
      userUid: fix.userRef.split('/').pop(),
      fixRef: fixRef.path,
    })
    tx.set(fixRef, {
      date: Timestamp.fromDate(fix.date),
      bookDate: Timestamp.fromDate(fix.bookDate),
      companyRef: fix.companyRef,
      car: mapICarToFirebase(fix.car),
      carMillage: fix.carMillage,
      userRef: fix.userRef,
      services: fix.services,
      description: fix.description,
      clientPhone: fix.clientPhone,
      clientName: fix.clientName,
      marketingConsent: fix.marketingConsent,
      notifications: [],
      isClosed: false,
      estimate: fix.estimate,
      reviewed: false,
      createdBy: fix.createdBy,
      confirmed: !byWorkshop,
      proposal: null,
      workshopNote: '',
      promotion: fix.promotion,
      createTime: serverTimestamp(),
    })
  })

  return mapIFix({ ...fix, confirmed: !byWorkshop, reference: fixRef.path })
}

/** Appends a status update; closing statuses also close the fix and free its slot. */
export async function addNotification(fix: IFix, notification: INotification): Promise<IFix> {
  const fixRef = doc(db(), fix.reference)
  const isClosing = CLOSING_NOTIFICATIONS.includes(notification.notificationType)

  await runTransaction(db(), async (tx) => {
    tx.update(fixRef, {
      isClosed: isClosing,
      notifications: arrayUnion(mapINotificationToFirebase(notification)),
    })
    if (isClosing) tx.delete(slotDoc(fix.companyRef, fix.date))
  })

  return readFix(fix.reference, fix)
}

/** Workshop suggests a new scope/date/estimate. Nothing changes until the client accepts. */
export async function proposeChange(fix: IFix, proposal: Omit<IFixProposal, 'createdAt'>, note: string): Promise<IFix> {
  await runTransaction(db(), async (tx) => {
    tx.update(doc(db(), fix.reference), {
      proposal: {
        services: proposal.services,
        description: proposal.description,
        date: Timestamp.fromDate(proposal.date),
        estimate: proposal.estimate,
        createdAt: Timestamp.now(),
      },
      notifications: arrayUnion(statusEntry('changeProposed', note)),
    })
  })
  return readFix(fix.reference, fix)
}

/** Client accepts the workshop's proposal; a new date moves the reserved slot. */
export async function acceptProposal(fix: IFix): Promise<IFix> {
  const proposal = fix.proposal
  if (!proposal) return fix
  const dateChanged = proposal.date.getTime() !== fix.date.getTime()

  await runTransaction(db(), async (tx) => {
    const newSlot = slotDoc(fix.companyRef, proposal.date)
    if (dateChanged && (await tx.get(newSlot)).exists()) throw new AppError('errors.slotTaken')

    if (dateChanged) {
      tx.delete(slotDoc(fix.companyRef, fix.date))
      tx.set(newSlot, {
        date: Timestamp.fromDate(proposal.date),
        userUid: fix.userRef.split('/').pop(),
        fixRef: fix.reference,
      })
    }
    tx.update(doc(db(), fix.reference), {
      services: proposal.services,
      description: proposal.description,
      date: Timestamp.fromDate(proposal.date),
      estimate: proposal.estimate,
      proposal: null,
      notifications: arrayUnion(statusEntry('changeAccepted')),
    })
  })
  return readFix(fix.reference, fix)
}

export async function rejectProposal(fix: IFix): Promise<IFix> {
  await runTransaction(db(), async (tx) => {
    tx.update(doc(db(), fix.reference), {
      proposal: null,
      notifications: arrayUnion(statusEntry('changeRejected')),
    })
  })
  return readFix(fix.reference, fix)
}

/** Client confirms a visit booked for them by the workshop. */
export async function confirmBooking(fix: IFix): Promise<IFix> {
  await runTransaction(db(), async (tx) => {
    tx.update(doc(db(), fix.reference), {
      confirmed: true,
      notifications: arrayUnion(statusEntry('bookingConfirmed')),
    })
  })
  return readFix(fix.reference, fix)
}

/** Note for the client, stored on the fix itself. */
export async function setPublicNote(fix: IFix, text: string): Promise<IFix> {
  await updateDoc(doc(db(), fix.reference), { workshopNote: text })
  return mapIFix({ ...fix, workshopNote: text })
}

/** Internal workshop note – a separate document the client cannot read (see firestore.rules). */
const internalNoteDoc = (fixRef: string) => doc(db(), `${fixRef}/internal/note`)

export async function getInternalNote(fixRef: string): Promise<string> {
  const snap = await getDoc(internalNoteDoc(fixRef))
  return snap.exists() ? String(snap.data().text ?? '') : ''
}

export async function setInternalNote(fixRef: string, text: string): Promise<void> {
  await setDoc(internalNoteDoc(fixRef), { text, updatedAt: serverTimestamp() })
}

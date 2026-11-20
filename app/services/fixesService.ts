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
  type Transaction,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { AppError } from '~/utils/errors'
import { fromDoc, fromQuery } from './mappers'
import { type IFix, type IFixProposal, mapIFix } from '~/models/fix'
import { type ICar, mapICarToFirebase } from '~/models/car'
import { mapIWorkshop, occupiedHours } from '~/models/workshop'
import {
  CLOSING_NOTIFICATIONS,
  type INotification,
  mapINotification,
  mapINotificationToFirebase,
  type NotificationType,
} from '~/models/notification'

const fixes = () => collection(db(), 'fixes')

/**
 * Booked hours live in `companies/{id}/slots/{ISO hour}_{station}` – one document per occupied
 * hour and service bay. Clients check availability there instead of reading other customers' fixes.
 * Older bookings used `{ISO hour}` without a station; they are still released correctly.
 */
const slotPath = (companyRef: string, slotId: string) => `${companyRef}/slots/${slotId}`
const slotId = (hour: Date, station: number) => `${hour.toISOString()}_${station}`

type Tx = Transaction

/**
 * Reads the company and finds a free bay for every hour of the visit (all reads – call before writes).
 * `ownIds` are slots of the same fix (moving a visit may overlap its old time) and count as free.
 */
async function findFreeSlots(tx: Tx, companyRef: string, start: Date, durationHours: number, ownIds: string[] = []): Promise<string[]> {
  const companySnap = await tx.get(doc(db(), companyRef))
  const workshop = mapIWorkshop(companySnap.data() ?? {})
  const ids: string[] = []
  for (const hour of occupiedHours(workshop, start, durationHours)) {
    let free: string | null = null
    for (let station = 0; station < workshop.stations && !free; station++) {
      const id = slotId(hour, station)
      if (ownIds.includes(id) || !(await tx.get(doc(db(), slotPath(companyRef, id)))).exists()) free = id
    }
    if (!free) throw new AppError('errors.slotTaken')
    ids.push(free)
  }
  return ids
}

function reserveSlots(tx: Tx, companyRef: string, ids: string[], fixRef: string, userRef: string) {
  for (const id of ids) {
    tx.set(doc(db(), slotPath(companyRef, id)), {
      date: Timestamp.fromDate(new Date(id.split('_')[0]!)),
      userUid: userRef.split('/').pop(),
      fixRef,
    })
  }
}

function releaseSlots(tx: Tx, fix: IFix) {
  const ids = fix.slotIds.length ? fix.slotIds : [fix.date.toISOString()]
  for (const id of ids) tx.delete(doc(db(), slotPath(fix.companyRef, id)))
}

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

/** Every fix of a customer (open and closed) – source of the car history. */
export async function getAllUserFixes(userRef: string): Promise<IFix[]> {
  return fromQuery<IFix>(await getDocs(query(fixes(), where('userRef', '==', userRef)))).map(mapIFix)
}

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
 * Creates the fix and reserves a bay for every hour of its duration atomically – fails if the
 * time was taken in the meantime. Workshop-created fixes start unconfirmed until the client accepts.
 */
export async function addFix(fix: IFix): Promise<IFix> {
  const fixRef = doc(fixes())
  const byWorkshop = fix.createdBy === 'workshop'
  let slotIds: string[] = []

  await runTransaction(db(), async (tx) => {
    slotIds = await findFreeSlots(tx, fix.companyRef, fix.date, fix.durationHours)
    reserveSlots(tx, fix.companyRef, slotIds, fixRef.path, fix.userRef)
    tx.set(fixRef, {
      date: Timestamp.fromDate(fix.date),
      bookDate: Timestamp.fromDate(fix.bookDate),
      companyRef: fix.companyRef,
      car: mapICarToFirebase(fix.car),
      carRef: fix.carRef,
      carMillage: fix.carMillage,
      durationHours: fix.durationHours,
      slotIds,
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
      photos: [],
      promotion: fix.promotion,
      createTime: serverTimestamp(),
    })
  })

  return mapIFix({ ...fix, slotIds, confirmed: !byWorkshop, reference: fixRef.path })
}

/** Appends a status update; closing statuses also close the fix and free its slots. */
export async function addNotification(fix: IFix, notification: INotification): Promise<IFix> {
  const fixRef = doc(db(), fix.reference)
  const isClosing = CLOSING_NOTIFICATIONS.includes(notification.notificationType)

  await runTransaction(db(), async (tx) => {
    tx.update(fixRef, {
      isClosed: isClosing,
      notifications: arrayUnion(mapINotificationToFirebase(notification)),
    })
    if (isClosing) releaseSlots(tx, fix)
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

/** Client accepts the workshop's proposal; a new date moves the reserved slots. */
export async function acceptProposal(fix: IFix): Promise<IFix> {
  const proposal = fix.proposal
  if (!proposal) return fix
  const dateChanged = proposal.date.getTime() !== fix.date.getTime()

  await runTransaction(db(), async (tx) => {
    let slotIds = fix.slotIds
    if (dateChanged) {
      slotIds = await findFreeSlots(tx, fix.companyRef, proposal.date, fix.durationHours, fix.slotIds)
      releaseSlots(tx, { ...fix, slotIds: fix.slotIds.filter(id => !slotIds.includes(id)) })
      reserveSlots(tx, fix.companyRef, slotIds.filter(id => !fix.slotIds.includes(id)), fix.reference, fix.userRef)
    }
    tx.update(doc(db(), fix.reference), {
      services: proposal.services,
      description: proposal.description,
      date: Timestamp.fromDate(proposal.date),
      estimate: proposal.estimate,
      slotIds,
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

/** Open repairs of a client – the ones whose snapshots may still be corrected. */
async function openFixesOf(userRef: string): Promise<IFix[]> {
  const snap = await getDocs(query(fixes(), where('userRef', '==', userRef), where('isClosed', '==', false)))
  return fromQuery<IFix>(snap).map(mapIFix)
}

/**
 * The client changed name/phone in the profile – update it on open repairs so the workshop
 * calls the right number. Closed repairs keep their history.
 */
export async function syncClientContact(userRef: string, clientName: string, clientPhone: string): Promise<void> {
  const open = (await openFixesOf(userRef)).filter(f => f.clientName !== clientName || f.clientPhone !== clientPhone)
  if (!open.length) return
  const batch = writeBatch(db())
  open.forEach(f => batch.update(doc(db(), f.reference), { clientName, clientPhone }))
  await batch.commit()
}

/**
 * The client corrected a saved car – update the snapshot on visits where the car was not
 * received yet (afterwards the snapshot is what the workshop actually worked on).
 */
export async function syncCarSnapshot(userRef: string, car: ICar): Promise<void> {
  const open = (await openFixesOf(userRef)).filter(f => f.carRef === car.reference && !f.notifications.length)
  if (!open.length) return
  const batch = writeBatch(db())
  open.forEach(f => batch.update(doc(db(), f.reference), { car: mapICarToFirebase(car) }))
  await batch.commit()
}

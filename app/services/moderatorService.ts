import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { arrayUnion, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db, firebaseApp } from './firebase'
import { fromQuery } from './mappers'
import { restore, softDelete } from './softDelete'
import { type IUser, mapIUser, type UserRole } from '~/models/user'
import { type IWorkshop, mapIWorkshop, type WorkshopStatus } from '~/models/workshop'
import { type IFix, mapIFix } from '~/models/fix'
import { type ICar, mapICar } from '~/models/car'
import { mapINotification, mapINotificationToFirebase } from '~/models/notification'

// Everything here only succeeds for users with role `moderator` (enforced by firestore.rules).

export async function getAllUsers(): Promise<IUser[]> {
  return fromQuery<IUser>(await getDocs(collection(db(), 'users'))).map(mapIUser)
}

export async function getAllWorkshops(): Promise<IWorkshop[]> {
  return fromQuery<IWorkshop>(await getDocs(collection(db(), 'companies'))).map(mapIWorkshop)
}

export async function getAllFixes(): Promise<IFix[]> {
  const snap = await getDocs(query(collection(db(), 'fixes'), orderBy('date', 'desc')))
  return fromQuery<IFix>(snap).map(mapIFix)
}

export async function getAllCars(): Promise<ICar[]> {
  return fromQuery<ICar>(await getDocs(collection(db(), 'cars'))).map(mapICar)
}

/** Live snapshot listeners for all moderator collections (users, companies, fixes, cars). */
export function watchAll(handlers: {
  onUsers: (users: IUser[]) => void
  onWorkshops: (workshops: IWorkshop[]) => void
  onFixes: (fixes: IFix[]) => void
  onCars: (cars: ICar[]) => void
  onError: (error: Error) => void
}): () => void {
  const unsubs = [
    onSnapshot(collection(db(), 'users'), snap => handlers.onUsers(fromQuery<IUser>(snap).map(mapIUser)), handlers.onError),
    onSnapshot(collection(db(), 'companies'), snap => handlers.onWorkshops(fromQuery<IWorkshop>(snap).map(mapIWorkshop)), handlers.onError),
    onSnapshot(query(collection(db(), 'fixes'), orderBy('date', 'desc')), snap => handlers.onFixes(fromQuery<IFix>(snap).map(mapIFix)), handlers.onError),
    onSnapshot(collection(db(), 'cars'), snap => handlers.onCars(fromQuery<ICar>(snap).map(mapICar)), handlers.onError),
  ]
  return () => unsubs.forEach(u => u())
}

export const setUserRole = (userRef: string, role: UserRole | null) => updateDoc(doc(db(), userRef), { role })

/** Soft delete – repairs and reviews keep pointing at the company. */
export const deleteWorkshop = (companyRef: string) => softDelete(companyRef)
export const restoreWorkshop = (companyRef: string) => restore(companyRef)

/** Unlocking (`approved`) records when the contract was signed. */
export const setWorkshopStatus = (companyRef: string, status: WorkshopStatus) =>
  updateDoc(doc(db(), companyRef), status === 'approved'
    ? { status, contractSignedAt: Timestamp.now() }
    : { status })

/**
 * Company created by a moderator (e.g. after signing a contract offline),
 * optionally linking an existing user or provisioning a new workshop owner by e-mail.
 */
export async function createWorkshop(
  workshop: IWorkshop,
  owner: IUser | null,
  ownerEmail?: string | null,
): Promise<IWorkshop> {
  const docRef = doc(collection(db(), 'companies'))
  const trimmedEmail = ownerEmail?.trim() ?? ''
  let createdUid: string | null = null
  let createdEmail = trimmedEmail.toLowerCase()

  if (!owner && trimmedEmail) {
    // Secondary app avoids signing out the moderator while provisioning the owner's Auth account.
    const secondary = initializeApp(firebaseApp().options, `create-owner-${Date.now()}`)
    const secondaryAuth = getAuth(secondary)
    try {
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, trimmedEmail, `${crypto.randomUUID()}Aa1!`)
      createdUid = user.uid
      createdEmail = user.email ?? createdEmail
      await sendPasswordResetEmail(secondaryAuth, createdEmail)
    }
    finally {
      await signOut(secondaryAuth).catch(() => {})
      await deleteApp(secondary).catch(() => {})
    }
  }

  const ownerUid = owner?.reference.split('/').pop() ?? createdUid ?? ''
  const approved = workshop.status === 'approved'
  const { reference: _reference, contractSignedAt: _signed, deletedAt: _deletedAt, ...data } = mapIWorkshop({ ...workshop, ownerUid })

  const batch = writeBatch(db())
  batch.set(docRef, {
    ...data,
    contractSignedAt: approved ? Timestamp.now() : null,
    createTime: serverTimestamp(),
  })
  if (owner) batch.update(doc(db(), owner.reference), { role: 'workshop', companyRef: docRef.path })
  else if (createdUid) {
    batch.set(doc(db(), 'users', createdUid), {
      email: createdEmail,
      role: 'workshop',
      companyRef: docRef.path,
      registerTime: serverTimestamp(),
    })
  }
  await batch.commit()

  return mapIWorkshop({ ...data, contractSignedAt: approved ? new Date() : null, reference: docRef.path })
}

/**
 * Cancels every open repair of a workshop (suspension / removal): adds a `moderatorCancel`
 * status with the reason – clients see it in their notification bell – and frees the slots.
 * Returns how many visits were cancelled.
 */
export async function cancelOpenFixes(companyRef: string, reason: string): Promise<number> {
  const snap = await getDocs(query(collection(db(), 'fixes'), where('companyRef', '==', companyRef), where('isClosed', '==', false)))
  const open = fromQuery<IFix>(snap).map(mapIFix)
  if (!open.length) return 0

  const batch = writeBatch(db())
  for (const fix of open) {
    batch.update(doc(db(), fix.reference), {
      isClosed: true,
      notifications: arrayUnion(mapINotificationToFirebase(mapINotification({ notificationType: 'moderatorCancel', description: reason }))),
    })
    const slotIds = fix.slotIds.length ? fix.slotIds : [fix.date.toISOString()]
    for (const id of slotIds) batch.delete(doc(db(), `${companyRef}/slots/${id}`))
  }
  await batch.commit()
  return open.length
}

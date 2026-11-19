import { collection, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './mappers'
import { restore, softDelete } from './softDelete'
import { type IUser, mapIUser, type UserRole } from '~/models/user'
import { type IWorkshop, mapIWorkshop, type WorkshopStatus } from '~/models/workshop'
import { type IFix, mapIFix } from '~/models/fix'
import { type ICar, mapICar } from '~/models/car'

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

export const setUserRole = (userRef: string, role: UserRole | null) => updateDoc(doc(db(), userRef), { role })

/** Soft delete – repairs and reviews keep pointing at the company. */
export const deleteWorkshop = (companyRef: string) => softDelete(companyRef)
export const restoreWorkshop = (companyRef: string) => restore(companyRef)

/** Unlocking (`approved`) records when the contract was signed. */
export const setWorkshopStatus = (companyRef: string, status: WorkshopStatus) =>
  updateDoc(doc(db(), companyRef), status === 'approved'
    ? { status, contractSignedAt: Timestamp.now() }
    : { status })

/** Company created by a moderator (e.g. after signing a contract offline), optionally with an owner account. */
export async function createWorkshop(workshop: IWorkshop, owner: IUser | null): Promise<IWorkshop> {
  const ref = doc(collection(db(), 'companies'))
  const ownerUid = owner?.reference.split('/').pop() ?? ''
  const approved = workshop.status === 'approved'
  const { reference: _reference, contractSignedAt: _signed, deletedAt: _deletedAt, ...data } = mapIWorkshop({ ...workshop, ownerUid })

  const batch = writeBatch(db())
  batch.set(ref, {
    ...data,
    contractSignedAt: approved ? Timestamp.now() : null,
    createTime: serverTimestamp(),
  })
  if (owner) batch.update(doc(db(), owner.reference), { role: 'workshop', companyRef: ref.path })
  await batch.commit()

  return mapIWorkshop({ ...data, contractSignedAt: approved ? new Date() : null, reference: ref.path })
}

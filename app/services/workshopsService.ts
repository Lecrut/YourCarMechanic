import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  type Timestamp,
  Timestamp as FirestoreTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { AppError } from '~/utils/errors'
import { fromDoc, fromQuery } from './mappers'
import { notDeleted } from '~/models/softDelete'
import { type IWorkshop, mapIWorkshop } from '~/models/workshop'

const companies = () => collection(db(), 'companies')

export async function getWorkshop(companyRef: string): Promise<IWorkshop | null> {
  const data = fromDoc<IWorkshop>(await getDoc(doc(db(), companyRef)))
  return data ? mapIWorkshop(data) : null
}

/** Only moderator-approved workshops are offered to customers. */
export async function getApprovedWorkshops(): Promise<IWorkshop[]> {
  const snap = await getDocs(query(companies(), where('status', '==', 'approved')))
  return notDeleted(fromQuery<IWorkshop>(snap).map(mapIWorkshop))
}

export async function addWorkshop(workshop: IWorkshop, ownerUid: string): Promise<IWorkshop> {
  const existing = await getDocs(query(companies(), where('nip', '==', workshop.nip)))
  if (!existing.empty) throw new AppError('errors.nipTaken')

  const { reference: _reference, deletedAt: _deletedAt, ...data } = mapIWorkshop({ ...workshop, ownerUid, status: 'pending', contractSignedAt: null })
  const docRef = await addDoc(companies(), { ...data, createTime: serverTimestamp() })
  return mapIWorkshop({ ...data, reference: docRef.path })
}

/** NIP, owner and status are immutable for workshop owners (enforced by firestore.rules). */
export async function updateWorkshop(workshop: IWorkshop): Promise<IWorkshop> {
  const { name, openingTime, closingTime, city, services, phone, address, hourlyRate, workingDays, stations, brands, location } = mapIWorkshop(workshop)
  await updateDoc(doc(db(), workshop.reference), { name, openingTime, closingTime, city, services, phone, address, hourlyRate, workingDays, stations, brands, location })
  return mapIWorkshop(workshop)
}

/** Real-time company doc for its owner – e.g. to see a moderator approving it. */
export const watchWorkshop = (companyRef: string, onChange: (workshop: IWorkshop | null) => void) =>
  onSnapshot(doc(db(), companyRef), (snap) => {
    const data = fromDoc<IWorkshop>(snap)
    onChange(data ? mapIWorkshop(data) : null)
  })

/**
 * Booked hours of a workshop in [from, to), watched while the customer picks a time
 * so slots taken by someone else disappear immediately. Returns the unsubscribe function.
 */
export function watchBookedSlots(
  companyRef: string,
  from: Date,
  to: Date,
  onChange: (slots: Date[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db(), `${companyRef}/slots`),
      where('date', '>=', FirestoreTimestamp.fromDate(from)),
      where('date', '<', FirestoreTimestamp.fromDate(to)),
    ),
    snap => onChange(snap.docs.map(d => (d.data().date as Timestamp).toDate())),
    onError,
  )
}

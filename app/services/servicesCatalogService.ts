import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { restore, softDelete } from './softDelete'
import { type IService, mapIService } from '~/models/service'

const services = () => collection(db(), 'services')

/** Includes deleted services – old repairs still need their labels. */
export async function getServices(): Promise<IService[]> {
  const snap = await getDocs(services())
  return snap.docs
    .map(d => mapIService({ key: d.id, ...d.data() }))
    .sort((a, b) => a.order - b.order)
}

export async function saveService(service: IService): Promise<IService> {
  const { deletedAt: _deletedAt, ...data } = mapIService(service)
  await setDoc(doc(services(), data.key), data, { merge: true })
  return mapIService(service)
}

export const deleteService = (key: string) => softDelete(`services/${key}`)
export const restoreService = (key: string) => restore(`services/${key}`)

export async function seedServices(list: IService[]): Promise<void> {
  // Firestore limits a single writeBatch to 500 operations.
  for (let i = 0; i < list.length; i += 450) {
    const batch = writeBatch(db())
    list.slice(i, i + 450).forEach((s) => {
      const { deletedAt: _deletedAt, ...data } = mapIService(s)
      batch.set(doc(services(), s.key), data)
    })
    await batch.commit()
  }
}

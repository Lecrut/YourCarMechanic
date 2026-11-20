import { type DocumentData, type DocumentSnapshot, type QuerySnapshot, Timestamp } from 'firebase/firestore'

/** Recursively converts Firestore Timestamps into JS Dates (e.g. `proposal.date`). */
function convert(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(convert)
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return convertTimestamps(value as DocumentData)
  return value
}

function convertTimestamps(data: DocumentData): DocumentData {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, convert(value)]))
}

/** Document data with Timestamps converted and `reference` set to the document path. */
export function fromDoc<T>(snap: DocumentSnapshot): T | null {
  if (!snap.exists()) return null
  return { ...convertTimestamps(snap.data()), reference: snap.ref.path } as T
}

export function fromQuery<T>(snap: QuerySnapshot): T[] {
  return snap.docs.map(d => ({ ...convertTimestamps(d.data()), reference: d.ref.path }) as T)
}

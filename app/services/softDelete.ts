import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

/** Marks a document as deleted – it stays in Firestore (see models/softDelete.ts). */
export const softDelete = (path: string) =>
  updateDoc(doc(db(), path), { deletedAt: serverTimestamp(), deletedBy: auth().currentUser?.uid ?? null })

/** Moderator undo of a soft delete. */
export const restore = (path: string) =>
  updateDoc(doc(db(), path), { deletedAt: null, deletedBy: null })

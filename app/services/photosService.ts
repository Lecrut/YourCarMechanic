import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage } from './firebase'
import type { IFix, IFixPhoto } from '~/models/fix'

/**
 * Uploads an (already downscaled) photo to `fixes/{id}/photos/` and appends it to the fix.
 * Access is limited to the parties of the repair by storage.rules and firestore.rules.
 */
export async function uploadPhoto(fix: IFix, image: Blob, by: IFixPhoto['by']): Promise<IFixPhoto> {
  const fixId = fix.reference.split('/').pop()
  const path = `fixes/${fixId}/photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const fileRef = storageRef(storage(), path)
  await uploadBytes(fileRef, image, { contentType: 'image/jpeg' })
  const photo: IFixPhoto = { path, url: await getDownloadURL(fileRef), by, at: new Date() }
  await updateDoc(doc(db(), fix.reference), { photos: arrayUnion({ ...photo, at: photo.at.toISOString() }) })
  return photo
}

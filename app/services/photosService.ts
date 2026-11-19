import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { db, firebaseApp, usesEmulators } from './firebase'
import type { IFix, IFixPhoto } from '~/models/fix'

/** The Storage SDK is only needed when someone uploads a photo – load it on demand (smaller main bundle). */
async function loadStorage() {
  const sdk = await import('firebase/storage')
  const storage = sdk.getStorage(firebaseApp())
  if (usesEmulators() && !connected) {
    sdk.connectStorageEmulator(storage, '127.0.0.1', 9199)
    connected = true
  }
  return { sdk, storage }
}
let connected = false

/**
 * Uploads an (already downscaled) photo to `fixes/{id}/photos/` and appends it to the fix.
 * Access is limited to the parties of the repair by storage.rules and firestore.rules.
 */
export async function uploadPhoto(fix: IFix, image: Blob, by: IFixPhoto['by']): Promise<IFixPhoto> {
  const { sdk, storage } = await loadStorage()
  const fixId = fix.reference.split('/').pop()
  const path = `fixes/${fixId}/photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const fileRef = sdk.ref(storage, path)
  await sdk.uploadBytes(fileRef, image, { contentType: 'image/jpeg' })
  const photo: IFixPhoto = { path, url: await sdk.getDownloadURL(fileRef), by, at: new Date() }
  await updateDoc(doc(db(), fix.reference), { photos: arrayUnion({ ...photo, at: photo.at.toISOString() }) })
  return photo
}

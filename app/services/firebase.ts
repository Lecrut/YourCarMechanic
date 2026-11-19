import { type FirebaseApp, type FirebaseOptions, getApps, initializeApp } from 'firebase/app'
import {
  type Auth,
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  type Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

let app: FirebaseApp | null = null

export function initFirebase(options: FirebaseOptions, useEmulators = false) {
  if (app) return app

  app = getApps()[0] ?? initializeApp(options)

  // Keep users signed in across browser restarts (IndexedDB, localStorage as fallback).
  const firebaseAuth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  })

  // Offline cache shared between tabs: lists render instantly from cache and survive short network drops.
  const firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })

  if (useEmulators) {
    connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  }

  return app
}

function requireApp(): FirebaseApp {
  if (!app) throw new Error('Firebase is not initialised – app/plugins/firebase.client.ts must run first.')
  return app
}

export const auth = (): Auth => getAuth(requireApp())
export const db = (): Firestore => getFirestore(requireApp())

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { AppError } from '~/utils/errors'
import { fromDoc } from './mappers'
import { type IUser, mapIUser } from '~/models/user'
import type { IUserProfile } from '~/models/userProfile'

const userDoc = (uid: string) => doc(db(), 'users', uid)

async function loadUser(uid: string): Promise<IUser> {
  const data = fromDoc<IUser>(await getDoc(userDoc(uid)))
  if (!data) throw new AppError('errors.profileMissing')
  return mapIUser(data)
}

export async function signUp(email: string, password: string): Promise<IUser> {
  const { user } = await createUserWithEmailAndPassword(auth(), email, password)
  await sendEmailVerification(user)
  // Firebase normalises the address (lower case) – store that, firestore.rules compare it with the token.
  const normalised = user.email ?? email
  await setDoc(userDoc(user.uid), { email: normalised, role: null, registerTime: serverTimestamp() })
  return mapIUser({ email: normalised, reference: userDoc(user.uid).path })
}

export async function logIn(email: string, password: string): Promise<IUser> {
  const { user } = await signInWithEmailAndPassword(auth(), email, password)
  return loadUser(user.uid)
}

export const logOut = () => signOut(auth())

export const resetPassword = (email: string) => sendPasswordResetEmail(auth(), email)

/** Resolves once Firebase has restored the session. */
export async function isSignedIn(): Promise<boolean> {
  await auth().authStateReady()
  return Boolean(auth().currentUser)
}

/** Profile of the restored session (e.g. when the local cache was cleared), or null when signed out. */
export async function loadCurrentUser(): Promise<IUser | null> {
  await auth().authStateReady()
  const user = auth().currentUser
  return user ? loadUser(user.uid) : null
}

/** Calls back with the signed-in user's uid, or null after sign-out. */
export const onAuthChange = (callback: (uid: string | null) => void) =>
  onAuthStateChanged(auth(), user => callback(user?.uid ?? null))

/** Real-time profile: a moderator may change the role while the user is online. */
export const watchUser = (uid: string, onChange: (user: IUser | null) => void) =>
  onSnapshot(userDoc(uid), (snap) => {
    const data = fromDoc<IUser>(snap)
    onChange(data ? mapIUser(data) : null)
  })

/** Completing the profile for the first time picks the `user` role. */
export async function updateProfile(userRef: string, profile: IUserProfile, currentRole: IUser['role']): Promise<IUser> {
  const ref = doc(db(), userRef)
  await updateDoc(ref, { profile, role: currentRole ?? 'user' })
  return loadUser(ref.id)
}

export async function setWorkshopOwner(userRef: string, companyRef: string): Promise<IUser> {
  const ref = doc(db(), userRef)
  await updateDoc(ref, { role: 'workshop', companyRef })
  return loadUser(ref.id)
}

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { fromQuery } from './snapshot'
import { notDeleted } from '~/domain/softDelete'
import { mapIReview } from '~/mappers/review'
import type { IReview } from '~/types/review'
import type { IFix } from '~/types/fix'

const reviews = () => collection(db(), 'reviews')

/** One review per fix (doc id = fix id); also marks the fix as reviewed. */
export async function addReview(fix: IFix, rating: number, comment: string, authorName: string): Promise<IReview> {
  const fixId = fix.reference.split('/').pop()!
  const reviewRef = doc(reviews(), fixId)
  const review = mapIReview({
    companyRef: fix.companyRef,
    fixRef: fix.reference,
    userRef: fix.userRef,
    authorName,
    rating,
    comment,
  })

  const batch = writeBatch(db())
  const { reference: _reference, createdAt: _createdAt, deletedAt: _deletedAt, ...data } = review
  batch.set(reviewRef, { ...data, createdAt: serverTimestamp() })
  batch.update(doc(db(), fix.reference), { reviewed: true })
  await batch.commit()

  return { ...review, reference: reviewRef.path }
}

/** Visible reviews of the given workshops (Firestore `in` accepts up to 30 values per query). */
export async function getReviewsForWorkshops(companyRefs: string[]): Promise<IReview[]> {
  const chunks: string[][] = []
  for (let i = 0; i < companyRefs.length; i += 30) chunks.push(companyRefs.slice(i, i + 30))

  const results = await Promise.all(chunks.map(chunk =>
    getDocs(query(reviews(), where('companyRef', 'in', chunk), where('hidden', '==', false))),
  ))
  return notDeleted(results.flatMap(snap => fromQuery<IReview>(snap).map(mapIReview)))
}

// Moderator only:

export async function getAllReviews(): Promise<IReview[]> {
  return fromQuery<IReview>(await getDocs(query(reviews(), orderBy('createdAt', 'desc')))).map(mapIReview)
}

export function watchAllReviews(onChange: (reviews: IReview[]) => void, onError: (error: Error) => void): () => void {
  return onSnapshot(
    query(reviews(), orderBy('createdAt', 'desc')),
    snap => onChange(fromQuery<IReview>(snap).map(mapIReview)),
    onError,
  )
}

export const setReviewHidden = (reviewRef: string, hidden: boolean) => updateDoc(doc(db(), reviewRef), { hidden })

/** Soft delete; also hides the review so public queries (`hidden == false`) never return it. */
export const deleteReview = (reviewRef: string) =>
  updateDoc(doc(db(), reviewRef), { hidden: true, deletedAt: serverTimestamp(), deletedBy: auth().currentUser?.uid ?? null })

/** Restored reviews stay hidden until the moderator shows them again. */
export const restoreReview = (reviewRef: string) =>
  updateDoc(doc(db(), reviewRef), { deletedAt: null, deletedBy: null })

/**
 * Nothing is ever removed from Firestore: "deleting" sets `deletedAt` / `deletedBy`.
 * Owners stop seeing the record, moderators still see (and can restore) it, and history
 * that references it (e.g. a car in a finished repair) stays intact.
 */
export interface ISoftDeletable {
  deletedAt: Date | null
}

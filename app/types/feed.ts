import type { NotificationType } from '~/types/notification'

/** Something worth telling the user about, derived from repair history (no extra collection). */
export interface IFeedEvent {
  id: string
  fixRef: string
  at: Date
  type: NotificationType | 'newBooking' | 'bookedForYou' | 'reminder' | 'giveBackCarReviewed'
  car: string
  client: string
  cost: number | null
  /** Visit time (for reminders). */
  visit: Date
  /** Comment of the status, e.g. why a moderator cancelled the visit. */
  note: string
}

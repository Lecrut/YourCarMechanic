import type { ICar } from '~/types/car'
import type { INotification } from '~/types/notification'
import type { Range } from '~/types/priceList'

/** Photo attached to a repair (file in Storage, metadata on the fix). */
export interface IFixPhoto {
  path: string
  url: string
  by: 'user' | 'workshop' | 'moderator'
  at: Date
}

/** A change of an existing repair suggested by the workshop – applied only after the client accepts. */
export interface IFixProposal {
  services: string[]
  description: string
  date: Date
  estimate: Range | null
  createdAt: Date
}

export type FixCreator = 'user' | 'workshop'

export interface IFix {
  date: Date
  bookDate: Date

  companyRef: string
  car: ICar
  /** The customer's saved car (`cars/{id}`) when booked with one; empty for one-off cars. */
  carRef: string
  carMillage: number
  /** Expected length (hours, 15-min steps) – decides how many hourly slots the visit occupies. */
  durationHours: number
  /** Booked slot documents (`companies/{id}/slots/{id}`), released when the repair closes. */
  slotIds: string[]
  userRef: string

  services: string[]
  description: string
  clientPhone: string
  /** Snapshot of the client's name – workshops cannot read `users` docs. */
  clientName: string
  /** Client agreed that this workshop may contact them with offers (GDPR). */
  marketingConsent: boolean

  notifications: INotification[]

  isClosed: boolean
  /** Price-list estimate at booking time; the mechanic's quote must fit in it. */
  estimate: Range | null
  reviewed: boolean
  /** Booked by the client, or by the workshop on the client's behalf. */
  createdBy: FixCreator
  /** Workshop-created bookings wait for the client's confirmation. */
  confirmed: boolean
  proposal: IFixProposal | null
  /** Promotion applied when booking (the estimate already includes it). */
  promotion: { title: string, percent: number } | null
  photos: IFixPhoto[]
  /** Note from the workshop, visible to the client. (The internal note lives in `fixes/{id}/internal/note`.) */
  workshopNote: string

  reference: string
}

/** Who is looking at a repair – decides which actions are available. */
export type ViewerMode = 'user' | 'workshop' | 'moderator'

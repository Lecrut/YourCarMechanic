import { CLOSING_NOTIFICATIONS, type INotification, mapINotification } from '~/models/notification'
import { type ICar, mapICar } from '~/models/car'
import type { Range } from '~/models/priceList'

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
  carMillage: number
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

  reference: string
}

type ProposalInput = Omit<IFixProposal, 'date' | 'createdAt'> & { date: Date | string, createdAt?: Date | string }

type FixInput = Partial<Omit<IFix, 'date' | 'bookDate' | 'notifications' | 'car' | 'proposal'>> & {
  proposal?: ProposalInput | null
  date?: Date | string
  bookDate?: Date | string
  car?: Partial<ICar>
  notifications?: Parameters<typeof mapINotification>[0][]
}

export function mapIFix(data: FixInput): IFix {
  return {
    date: new Date(data.date ?? Date.now()),
    bookDate: new Date(data.bookDate ?? Date.now()),

    companyRef: data.companyRef || '',
    car: mapICar({ ...data.car }),
    carMillage: Number(data.carMillage || 0),
    userRef: data.userRef || '',

    services: [...(data.services ?? [])],
    description: data.description || '',
    clientPhone: data.clientPhone || '',
    clientName: data.clientName || '',
    marketingConsent: data.marketingConsent || false,

    notifications: (data.notifications ?? []).map(mapINotification),

    isClosed: data.isClosed || false,
    estimate: data.estimate ? { min: Number(data.estimate.min), max: Number(data.estimate.max) } : null,
    reviewed: data.reviewed || false,
    createdBy: data.createdBy || 'user',
    confirmed: data.confirmed ?? true,
    proposal: data.proposal
      ? {
          services: [...data.proposal.services],
          description: data.proposal.description || '',
          date: new Date(data.proposal.date),
          estimate: data.proposal.estimate ?? null,
          createdAt: new Date(data.proposal.createdAt ?? Date.now()),
        }
      : null,

    reference: data.reference || '',
  }
}

/** Progress (0-100) shown on repair cards. */
export function fixProgress(fix: IFix): number {
  const types = fix.notifications.map(n => n.notificationType)
  if (types.includes('giveBackCar')) return 100
  if (types.some(t => t === 'userCancel' || t === 'workshopCancel' || t === 'moderatorCancel')) return 0
  if (types.length === 0) return 10
  return types.length > 1 ? 60 : 30
}

export function isFixFinished(fix: IFix): boolean {
  return fix.notifications.some(n => CLOSING_NOTIFICATIONS.includes(n.notificationType))
}

/** The car was handed back (not cancelled) – the customer may leave a review. */
export const canBeReviewed = (fix: IFix) =>
  !fix.reviewed && fix.notifications.some(n => n.notificationType === 'giveBackCar')

/** Latest quote added by the mechanic, if any. */
export const latestQuote = (fix: IFix) =>
  [...fix.notifications].reverse().find(n => n.notificationType === 'addQuote') ?? null

/** Who is looking at a repair – decides which actions are available. */
export type ViewerMode = 'user' | 'workshop' | 'moderator'

/** Something is waiting for the client's decision. */
export const awaitsClientDecision = (fix: IFix) => !fix.isClosed && (!fix.confirmed || fix.proposal !== null)

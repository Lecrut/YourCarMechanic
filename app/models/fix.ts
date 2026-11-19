import { CLOSING_NOTIFICATIONS, type INotification, mapINotification } from '~/models/notification'
import { type ICar, mapICar } from '~/models/car'
import type { Range } from '~/models/priceList'

/** Photo attached to a repair (file in Storage, metadata on the fix). */
export interface IFixPhoto {
  path: string
  url: string
  by: 'user' | 'workshop' | 'moderator'
  at: Date
}

/** Most photos one repair can have (also enforced by firestore.rules). */
export const MAX_PHOTOS = 20

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

type ProposalInput = Omit<IFixProposal, 'date' | 'createdAt'> & { date: Date | string, createdAt?: Date | string }

type FixInput = Partial<Omit<IFix, 'date' | 'bookDate' | 'notifications' | 'car' | 'proposal' | 'photos'>> & {
  photos?: (Omit<IFixPhoto, 'at'> & { at: Date | string })[]
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
    carRef: data.carRef || '',
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
    workshopNote: data.workshopNote || '',
    photos: (data.photos ?? []).map(p => ({ path: p.path, url: p.url, by: p.by, at: new Date(p.at) })),
    promotion: data.promotion ? { title: data.promotion.title || '', percent: Number(data.promotion.percent) || 0 } : null,

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

/** Most recent status, or null for a fresh booking. */
export const lastStatus = (fix: IFix) => fix.notifications.at(-1) ?? null

/** What the client pays so far: the latest quote plus every extra expense. */
export function totalCost(fix: IFix): number | null {
  const quote = latestQuote(fix)?.cost ?? 0
  const expenses = fix.notifications
    .filter(n => n.notificationType === 'addExpense')
    .reduce((sum, n) => sum + Number(n.cost ?? 0), 0)
  const total = Number(quote) + expenses
  return total > 0 ? total : null
}

/** Colour used for a repair's status everywhere (cards, tables). */
export function statusColor(fix: IFix): string {
  const progress = fixProgress(fix)
  if (progress === 100) return 'success'
  if (progress === 0) return 'error'
  if (awaitsClientDecision(fix)) return 'warning'
  return fix.notifications.length ? 'primary' : 'info'
}

/** Case-insensitive search over the fields a mechanic remembers: client, phone, car, VIN, description. */
export function matchesSearch(fix: IFix, text: string): boolean {
  const needle = text.trim().toLowerCase()
  if (!needle) return true
  return [fix.clientName, fix.clientPhone, fix.car.manufacturer, fix.car.model, fix.car.vin, fix.description]
    .some(value => value.toLowerCase().includes(needle))
}

export const isOnDay = (fix: IFix, day: Date) => fix.date.toDateString() === day.toDateString()

/** The client accepted the latest quote (a newer quote needs a new acceptance). */
export function isQuoteAccepted(fix: IFix): boolean {
  const lastQuote = fix.notifications.findLastIndex(n => n.notificationType === 'addQuote')
  const lastAcceptance = fix.notifications.findLastIndex(n => n.notificationType === 'quoteAccepted')
  return lastQuote >= 0 && lastAcceptance > lastQuote
}

export const canAcceptQuote = (fix: IFix) => !fix.isClosed && Boolean(latestQuote(fix)) && !isQuoteAccepted(fix)

/** The client's nearest upcoming, confirmed, open visit. */
export const nextVisit = (fixes: IFix[], now = new Date()) =>
  fixes
    .filter(f => !f.isClosed && f.confirmed && f.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null

/**
 * Repairs of a saved car, newest first. Newer repairs link the car by `carRef`; older ones are
 * matched by VIN or by brand + model + production year.
 */
export function fixesForCar(fixes: IFix[], car: ICar): IFix[] {
  const sameModel = (f: IFix) => !f.carRef
    && f.car.manufacturer === car.manufacturer && f.car.model === car.model && f.car.productionYear === car.productionYear
  return fixes
    .filter(f => f.carRef === car.reference || (car.vin && f.car.vin === car.vin) || sameModel(f))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

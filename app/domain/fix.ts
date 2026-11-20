import { CLOSING_NOTIFICATIONS } from '~/domain/notification'
import type { ICar } from '~/types/car'
import type { IFix } from '~/types/fix'

/** Most photos one repair can have (also enforced by firestore.rules). */
export const MAX_PHOTOS = 20

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

/**
 * The client may move the visit to another free time on their own – until the workshop
 * received the car. (The workshop has to ask: it sends a proposal the client accepts.)
 */
export const canReschedule = (fix: IFix, now = new Date()) =>
  !fix.isClosed && fix.confirmed && !fix.proposal && fix.date > now
  && !fix.notifications.some(n => n.notificationType === 'getCar')

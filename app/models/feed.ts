import type { IFix } from '~/models/fix'
import type { NotificationType } from '~/models/notification'
import type { UserRole } from '~/models/user'

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

/** Statuses the *other* party adds – those are the news for each role. */
const FOR_CLIENT: NotificationType[] = [
  'getCar', 'addQuote', 'addGiveBackTime', 'addExpense', 'giveBackCar', 'workshopCancel', 'moderatorCancel', 'changeProposed',
]
const FOR_WORKSHOP: NotificationType[] = [
  'userCancel', 'quoteAccepted', 'changeAccepted', 'changeRejected', 'bookingConfirmed', 'rescheduled', 'moderatorCancel',
]

/** How long before a visit the reminder shows up. */
export const REMINDER_HOURS = 24

export function buildFeed(fixes: IFix[], role: UserRole | null, limit = 30, now = new Date()): IFeedEvent[] {
  if (role !== 'user' && role !== 'workshop') return []
  const relevant = role === 'user' ? FOR_CLIENT : FOR_WORKSHOP
  const events: IFeedEvent[] = []

  for (const fix of fixes) {
    const base = {
      fixRef: fix.reference,
      car: `${fix.car.manufacturer} ${fix.car.model}`.trim(),
      client: fix.clientName || fix.clientPhone,
      visit: fix.date,
      note: '',
    }

    // Reminder for confirmed, still open visits starting within the next 24 h.
    const remindFrom = new Date(fix.date.getTime() - REMINDER_HOURS * 3_600_000)
    if (!fix.isClosed && fix.confirmed && now >= remindFrom && now < fix.date)
      events.push({ ...base, id: `${fix.reference}#reminder`, at: remindFrom > fix.bookDate ? remindFrom : fix.bookDate, type: 'reminder', cost: null })

    if (role === 'workshop' && fix.createdBy === 'user')
      events.push({ ...base, id: `${fix.reference}#booking`, at: fix.bookDate, type: 'newBooking', cost: null })
    if (role === 'user' && fix.createdBy === 'workshop')
      events.push({ ...base, id: `${fix.reference}#booking`, at: fix.bookDate, type: 'bookedForYou', cost: null })

    fix.notifications.forEach((n, index) => {
      if (!relevant.includes(n.notificationType)) return
      // After the review the hand-over event no longer asks for one.
      const type = n.notificationType === 'giveBackCar' && fix.reviewed ? 'giveBackCarReviewed' : n.notificationType
      events.push({ ...base, id: `${fix.reference}#${index}`, at: n.sendDate, type, cost: n.cost, note: n.description })
    })
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}

export const unreadCount = (events: IFeedEvent[], lastSeen: Date | null) =>
  events.filter(e => !lastSeen || e.at > lastSeen).length

/**
 * Grammatical relative time in the UI language: "przed chwilą", "za 30 minut", "3 godziny temu",
 * "jutro", "pojutrze", "za 5 dni". Within a day it counts minutes/hours, beyond that calendar days.
 */
export function formatRelative(at: Date, locale: string, now = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', { numeric: 'auto' })
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000)
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((dayStart(at) - dayStart(now)) / 86_400_000)
  if (Math.abs(minutes) < 1) return rtf.format(0, 'second')
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (days === 0 || Math.abs(minutes) < 6 * 60) return rtf.format(Math.trunc(minutes / 60), 'hour')
  return rtf.format(days, 'day')
}

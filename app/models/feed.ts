import type { IFix } from '~/models/fix'
import type { NotificationType } from '~/models/notification'
import type { UserRole } from '~/models/user'

/** Something worth telling the user about, derived from repair history (no extra collection). */
export interface IFeedEvent {
  id: string
  fixRef: string
  at: Date
  type: NotificationType | 'newBooking' | 'bookedForYou' | 'reminder'
  car: string
  client: string
  cost: number | null
  /** Visit time (for reminders). */
  visit: Date
}

/** Statuses the *other* party adds – those are the news for each role. */
const FOR_CLIENT: NotificationType[] = [
  'getCar', 'addQuote', 'addGiveBackTime', 'addExpense', 'giveBackCar', 'workshopCancel', 'moderatorCancel', 'changeProposed',
]
const FOR_WORKSHOP: NotificationType[] = [
  'userCancel', 'quoteAccepted', 'changeAccepted', 'changeRejected', 'bookingConfirmed', 'moderatorCancel',
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
      if (relevant.includes(n.notificationType))
        events.push({ ...base, id: `${fix.reference}#${index}`, at: n.sendDate, type: n.notificationType, cost: n.cost })
    })
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}

export const unreadCount = (events: IFeedEvent[], lastSeen: Date | null) =>
  events.filter(e => !lastSeen || e.at > lastSeen).length

/** "5 min", "3 h", "2 d" – compact relative time for the feed. */
export function relativeTime(at: Date, now = new Date()): { value: number, unit: 'now' | 'min' | 'h' | 'd' } {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000)
  if (minutes < 1) return { value: 0, unit: 'now' }
  if (minutes < 60) return { value: minutes, unit: 'min' }
  if (minutes < 60 * 24) return { value: Math.floor(minutes / 60), unit: 'h' }
  return { value: Math.floor(minutes / (60 * 24)), unit: 'd' }
}

/** Time until a future moment, rounded down: minutes, hours or days. */
export function timeUntil(at: Date, now = new Date()): { value: number, unit: 'min' | 'h' | 'd' } {
  const minutes = Math.max(0, Math.floor((at.getTime() - now.getTime()) / 60_000))
  if (minutes < 60) return { value: minutes, unit: 'min' }
  if (minutes < 60 * 24) return { value: Math.floor(minutes / 60), unit: 'h' }
  return { value: Math.floor(minutes / (60 * 24)), unit: 'd' }
}

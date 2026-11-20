import { latestQuote } from '~/domain/fix'
import type { IFix } from '~/types/fix'
import type { NotificationType } from '~/types/notification'
import type { IReview } from '~/types/review'
import type { FixOutcome, IStats, IWorkshopStats } from '~/types/stats'

const HOUR = 3_600_000

const CANCELS: NotificationType[] = ['userCancel', 'workshopCancel', 'moderatorCancel']

export function fixOutcome(fix: IFix): FixOutcome {
  const types = fix.notifications.map(n => n.notificationType)
  if (types.includes('giveBackCar')) return 'finished'
  if (types.some(t => CANCELS.includes(t))) return 'cancelled'
  return 'inProgress'
}

const firstDate = (fix: IFix, type: NotificationType) =>
  fix.notifications.find(n => n.notificationType === type)?.date ?? null

/** Hours between receiving the car and handing it back (null if the repair isn't finished). */
export function repairHours(fix: IFix): number | null {
  const received = firstDate(fix, 'getCar')
  const returned = firstDate(fix, 'giveBackCar')
  if (!received || !returned || returned < received) return null
  return (returned.getTime() - received.getTime()) / HOUR
}

/** Hours between the booking and the workshop receiving the car. */
export function waitHours(fix: IFix): number | null {
  const received = firstDate(fix, 'getCar')
  if (!received || received < fix.bookDate) return null
  return (received.getTime() - fix.bookDate.getTime()) / HOUR
}

const average = (values: number[]) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null

export function computeStats(fixes: IFix[], reviews: IReview[], now = new Date()): IStats {
  const byOutcome: Record<FixOutcome, number> = { inProgress: 0, finished: 0, cancelled: 0 }
  const services = new Map<string, number>()
  const workshops = new Map<string, { fixes: IFix[] }>()

  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1))
  const perMonth = months.map(month => ({ month, count: 0 }))

  for (const fix of fixes) {
    byOutcome[fixOutcome(fix)]++
    for (const s of fix.services) services.set(s, (services.get(s) ?? 0) + 1)

    const entry = workshops.get(fix.companyRef) ?? { fixes: [] }
    entry.fixes.push(fix)
    workshops.set(fix.companyRef, entry)

    const idx = perMonth.findIndex(p =>
      p.month.getFullYear() === fix.date.getFullYear() && p.month.getMonth() === fix.date.getMonth())
    if (idx >= 0) perMonth[idx]!.count++
  }

  const quoteOf = (f: IFix) => (fixOutcome(f) === 'finished' ? Number(latestQuote(f)?.cost ?? 0) : 0)
  const visibleReviews = reviews.filter(r => !r.hidden && !r.deletedAt)

  const workshopStats: IWorkshopStats[] = [...workshops.entries()].map(([companyRef, { fixes: list }]) => ({
    companyRef,
    repairs: list.length,
    finished: list.filter(f => fixOutcome(f) === 'finished').length,
    avgRepairHours: average(list.map(repairHours).filter((h): h is number => h !== null)),
    avgRating: average(visibleReviews.filter(r => r.companyRef === companyRef).map(r => r.rating)),
    quotesTotal: list.reduce((sum, f) => sum + quoteOf(f), 0),
  })).sort((a, b) => b.repairs - a.repairs)

  const closed = byOutcome.finished + byOutcome.cancelled

  return {
    total: fixes.length,
    byOutcome,
    cancelRate: closed ? Math.round((byOutcome.cancelled / closed) * 100) : 0,
    avgRepairHours: average(fixes.map(repairHours).filter((h): h is number => h !== null)),
    avgWaitHours: average(fixes.map(waitHours).filter((h): h is number => h !== null)),
    quotesTotal: fixes.reduce((sum, f) => sum + quoteOf(f), 0),
    perMonth,
    topServices: [...services.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    workshops: workshopStats,
  }
}

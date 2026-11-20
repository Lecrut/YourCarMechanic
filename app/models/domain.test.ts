import { describe, expect, it } from 'vitest'
import { awaitsClientDecision, canBeReviewed, fixProgress, isFixFinished, latestQuote } from '~/domain/fix'
import { mapIFix } from '~/mappers/fix'
import { buildClients } from '~/domain/client'
import { computeStats, fixOutcome, repairHours, waitHours } from '~/domain/stats'
import { ratingSummary } from '~/domain/review'
import { mapIReview } from '~/mappers/review'
import { notDeleted } from '~/domain/softDelete'
import { mapICar } from '~/mappers/car'
import { mapINotification } from '~/mappers/notification'
import type { NotificationType } from '~/types/notification'

const d = (iso: string) => new Date(iso)
const status = (notificationType: NotificationType, date: string, cost?: number) =>
  mapINotification({ notificationType, date: d(date), sendDate: d(date), cost })

const base = mapIFix({
  date: d('2026-10-10T10:00:00'),
  bookDate: d('2026-10-01T09:00:00'),
  companyRef: 'companies/a',
  userRef: 'users/u1',
  car: mapICar({ manufacturer: 'BMW', model: 'X1', productionYear: 2020 }),
  services: ['oil'],
  clientName: 'Anna',
  clientPhone: '600100200',
})

const finished = mapIFix({
  ...base,
  isClosed: true,
  notifications: [
    status('getCar', '2026-10-10T10:00:00'),
    status('addQuote', '2026-10-10T12:00:00', 450),
    status('giveBackCar', '2026-10-11T10:00:00'),
  ],
})

describe('fix helpers', () => {
  it('progress follows the status timeline', () => {
    expect(fixProgress(base)).toBe(10)
    expect(fixProgress(mapIFix({ ...base, notifications: [status('getCar', '2026-10-10')] }))).toBe(30)
    expect(fixProgress(finished)).toBe(100)
    expect(fixProgress(mapIFix({ ...base, notifications: [status('moderatorCancel', '2026-10-10')] }))).toBe(0)
  })

  it('finished/cancelled are closing statuses', () => {
    expect(isFixFinished(finished)).toBe(true)
    expect(isFixFinished(base)).toBe(false)
  })

  it('only handed-back, not yet reviewed repairs can be reviewed', () => {
    expect(canBeReviewed(finished)).toBe(true)
    expect(canBeReviewed(mapIFix({ ...finished, reviewed: true }))).toBe(false)
    expect(canBeReviewed(mapIFix({ ...base, notifications: [status('userCancel', '2026-10-09')] }))).toBe(false)
  })

  it('latestQuote picks the last quote', () => {
    const fix = mapIFix({ ...base, notifications: [status('addQuote', '2026-10-10', 100), status('addQuote', '2026-10-11', 200)] })
    expect(latestQuote(fix)?.cost).toBe(200)
    expect(latestQuote(base)).toBeNull()
  })

  it('client decision is needed for unconfirmed bookings and open proposals', () => {
    expect(awaitsClientDecision(base)).toBe(false)
    expect(awaitsClientDecision(mapIFix({ ...base, confirmed: false }))).toBe(true)
    expect(awaitsClientDecision(mapIFix({ ...base, proposal: { services: ['oil'], description: '', date: base.date, estimate: null } }))).toBe(true)
    expect(awaitsClientDecision(mapIFix({ ...base, confirmed: false, isClosed: true }))).toBe(false)
  })
})

describe('buildClients', () => {
  it('groups fixes by client, merges cars/services and keeps the latest consent', () => {
    const later = mapIFix({
      ...base,
      date: d('2026-11-01T10:00:00'),
      services: ['tires'],
      car: mapICar({ manufacturer: 'Skoda', model: 'Fabia', productionYear: 2012 }),
      marketingConsent: true,
    })
    const other = mapIFix({ ...base, userRef: 'users/u2', clientName: 'Jan', date: d('2026-09-01T10:00:00') })

    const clients = buildClients([later, base, other])
    expect(clients.map(c => c.name)).toEqual(['Anna', 'Jan'])
    const anna = clients[0]!
    expect(anna.visits).toBe(2)
    expect(anna.services).toEqual(['oil', 'tires'])
    expect(anna.cars).toHaveLength(2)
    expect(anna.marketingConsent).toBe(true)
    expect(anna.lastVisit).toEqual(d('2026-11-01T10:00:00'))
  })
})

describe('stats', () => {
  it('measures repair and waiting time in hours', () => {
    expect(repairHours(finished)).toBe(24)
    expect(waitHours(finished)).toBe(9 * 24 + 1)
    expect(repairHours(base)).toBeNull()
  })

  it('computes totals, outcomes, cancel rate and per-workshop ranking', () => {
    const cancelled = mapIFix({ ...base, isClosed: true, notifications: [status('userCancel', '2026-10-05')] })
    const reviews = [
      mapIReview({ companyRef: 'companies/a', rating: 4 }),
      mapIReview({ companyRef: 'companies/a', rating: 2, hidden: true }),
    ]
    const s = computeStats([base, finished, cancelled], reviews, d('2026-11-15T00:00:00'))

    expect(s.total).toBe(3)
    expect(s.byOutcome).toEqual({ inProgress: 1, finished: 1, cancelled: 1 })
    expect(s.cancelRate).toBe(50)
    expect(s.avgRepairHours).toBe(24)
    expect(s.quotesTotal).toBe(450)
    expect(s.perMonth).toHaveLength(12)
    expect(s.perMonth.at(-2)!.count).toBe(3) // October
    expect(s.workshops[0]).toMatchObject({ companyRef: 'companies/a', repairs: 3, finished: 1, avgRating: 4 })
    expect(fixOutcome(cancelled)).toBe('cancelled')
  })
})

describe('reviews & soft delete', () => {
  it('rating summary ignores hidden and deleted reviews', () => {
    const reviews = [
      mapIReview({ rating: 5 }),
      mapIReview({ rating: 1, hidden: true }),
      mapIReview({ rating: 1, deletedAt: new Date() }),
      mapIReview({ rating: 4 }),
    ]
    expect(ratingSummary(reviews)).toEqual({ average: 4.5, count: 2 })
  })

  it('notDeleted filters soft-deleted records', () => {
    const cars = [mapICar({ model: 'A' }), mapICar({ model: 'B', deletedAt: new Date() })]
    expect(notDeleted(cars).map(c => c.model)).toEqual(['A'])
  })
})

import { describe, expect, it } from 'vitest'
import { computeStats, fixOutcome, repairHours, waitHours } from '~/domain/stats'
import { mapICar } from '~/mappers/car'
import { mapIFix } from '~/mappers/fix'
import { mapINotification } from '~/mappers/notification'
import { mapIReview } from '~/mappers/review'
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

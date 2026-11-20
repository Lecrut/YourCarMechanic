import { describe, expect, it } from 'vitest'
import { awaitsClientDecision, canAcceptQuote, canBeReviewed, canReschedule, fixProgress, fixesForCar, isFixFinished, isOnDay, isQuoteAccepted, lastStatus, latestQuote, matchesSearch, statusColor, totalCost } from '~/domain/fix'
import { mapICar } from '~/mappers/car'
import { mapIFix } from '~/mappers/fix'
import { mapINotification } from '~/mappers/notification'
import type { NotificationType } from '~/types/notification'

describe('fix helpers', () => {
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

describe('repair helpers', () => {
  const s = (notificationType: NotificationType, cost?: number) => mapINotification({ notificationType, cost })
  const fix = (date: string, extra: Parameters<typeof mapIFix>[0] = {}) => mapIFix({
    date: new Date(date),
    bookDate: new Date('2026-11-01T09:00:00'),
    car: mapICar({ manufacturer: 'Skoda', model: 'Octavia', vin: 'TMBJJ7NE8L0123456' }),
    clientName: 'Anna Kowalska',
    clientPhone: '600100200',
    description: 'Stuki w zawieszeniu',
    reference: `fixes/${date}`,
    ...extra,
  })

  it('total cost = latest quote + expenses', () => {
    expect(totalCost(fix('2026-11-20T10:00:00'))).toBeNull()
    expect(totalCost(fix('2026-11-20T10:00:00', { notifications: [s('addQuote', 300), s('addQuote', 400), s('addExpense', 50)] }))).toBe(450)
  })

  it('last status and colour', () => {
    const f = fix('2026-11-20T10:00:00', { notifications: [s('getCar')] })
    expect(lastStatus(f)?.notificationType).toBe('getCar')
    expect(statusColor(f)).toBe('primary')
    expect(statusColor(fix('2026-11-20T10:00:00'))).toBe('info')
    expect(statusColor(fix('2026-11-20T10:00:00', { confirmed: false }))).toBe('warning')
  })

  it('search matches client, phone, car, VIN and description', () => {
    const f = fix('2026-11-20T10:00:00')
    for (const q of ['anna', '600100', 'octavia', 'tmbjj', 'stuki', '']) expect(matchesSearch(f, q)).toBe(true)
    expect(matchesSearch(f, 'bmw')).toBe(false)
  })

  it('isOnDay compares calendar days', () => {
    expect(isOnDay(fix('2026-11-20T10:00:00'), new Date('2026-11-20T23:00:00'))).toBe(true)
    expect(isOnDay(fix('2026-11-20T10:00:00'), new Date('2026-11-21T00:00:00'))).toBe(false)
  })
})

describe('car history', () => {
  const bmw = mapICar({ manufacturer: 'BMW', model: 'X1', productionYear: 2020, vin: 'WBA0000000000001', reference: 'cars/bmw' })
  const skoda = mapICar({ manufacturer: 'Skoda', model: 'Fabia', productionYear: 2012, reference: 'cars/skoda' })

  it('matches by car reference, then VIN, then brand/model/year for old repairs', () => {
    const byRef = mapIFix({ reference: 'fixes/1', carRef: 'cars/bmw', car: { ...bmw, vin: '' }, date: new Date('2026-01-01') })
    const byVin = mapIFix({ reference: 'fixes/2', car: bmw, date: new Date('2026-03-01') })
    const byModel = mapIFix({ reference: 'fixes/3', car: { ...bmw, vin: '' }, date: new Date('2026-02-01') })
    const otherCar = mapIFix({ reference: 'fixes/4', carRef: 'cars/skoda', car: skoda })
    const otherRefSameModel = mapIFix({ reference: 'fixes/5', carRef: 'cars/another-x1', car: { ...bmw, vin: '' } })

    expect(fixesForCar([byRef, byVin, byModel, otherCar, otherRefSameModel], bmw).map(f => f.reference))
      .toEqual(['fixes/2', 'fixes/3', 'fixes/1'])
  })
})

describe('client rescheduling', () => {
  const fix = (ref: string, iso: string, extra: Parameters<typeof mapIFix>[0] = {}) =>
    mapIFix({ reference: `fixes/${ref}`, date: new Date(iso), ...extra })

  const now = new Date('2026-11-20T12:00:00')
  it('only confirmed, open, future visits before the car was received', () => {
    expect(canReschedule(fix('1', '2026-11-25T10:00:00'), now)).toBe(true)
    expect(canReschedule(fix('2', '2026-11-19T10:00:00'), now)).toBe(false)
    expect(canReschedule(fix('3', '2026-11-25T10:00:00', { confirmed: false }), now)).toBe(false)
    expect(canReschedule(fix('4', '2026-11-25T10:00:00', { notifications: [mapINotification({ notificationType: 'getCar' })] }), now)).toBe(false)
    expect(canReschedule(fix('5', '2026-11-25T10:00:00', { isClosed: true }), now)).toBe(false)
  })
})

describe('quotes', () => {
  const s = (t: NotificationType) => mapINotification({ notificationType: t, cost: 100 })
  const fix = (types: NotificationType[]) => mapIFix({ notifications: types.map(s) })

  it('a newer quote needs a new acceptance', () => {
    expect(isQuoteAccepted(fix(['getCar', 'addQuote', 'quoteAccepted']))).toBe(true)
    expect(isQuoteAccepted(fix(['getCar', 'addQuote', 'quoteAccepted', 'addQuote']))).toBe(false)
    expect(canAcceptQuote(fix(['getCar', 'addQuote']))).toBe(true)
    expect(canAcceptQuote(fix(['getCar']))).toBe(false)
  })
})

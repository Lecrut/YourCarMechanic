import { describe, expect, it } from 'vitest'
import { fixesForCar, mapIFix, nextVisit } from './fix'
import { buildFeed, timeUntil } from './feed'
import { mapICar } from './car'

const bmw = mapICar({ manufacturer: 'BMW', model: 'X1', productionYear: 2020, vin: 'WBA0000000000001', reference: 'cars/bmw' })
const skoda = mapICar({ manufacturer: 'Skoda', model: 'Fabia', productionYear: 2012, reference: 'cars/skoda' })

describe('car history', () => {
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

describe('next visit and reminders', () => {
  const now = new Date('2026-11-19T12:00:00')
  const visit = (iso: string, extra = {}) => mapIFix({ reference: `fixes/${iso}`, date: new Date(iso), bookDate: new Date('2026-11-01T10:00:00'), ...extra })

  it('next visit is the nearest confirmed, open, future one', () => {
    const list = [visit('2026-11-25T10:00:00'), visit('2026-11-21T10:00:00'), visit('2026-11-20T09:00:00', { confirmed: false }), visit('2026-11-18T10:00:00')]
    expect(nextVisit(list, now)?.reference).toBe('fixes/2026-11-21T10:00:00')
    expect(nextVisit([], now)).toBeNull()
  })

  it('reminds both sides within 24 h before a confirmed visit', () => {
    const tomorrow = visit('2026-11-20T10:00:00')
    const later = visit('2026-11-22T10:00:00')
    const unconfirmed = visit('2026-11-20T11:00:00', { confirmed: false })
    for (const role of ['user', 'workshop'] as const) {
      const reminders = buildFeed([tomorrow, later, unconfirmed], role, 30, now).filter(e => e.type === 'reminder')
      expect(reminders.map(e => e.fixRef)).toEqual(['fixes/2026-11-20T10:00:00'])
      expect(reminders[0]!.at).toEqual(new Date('2026-11-19T10:00:00'))
    }
  })

  it('time until a visit', () => {
    expect(timeUntil(new Date('2026-11-19T12:30:00'), now)).toEqual({ value: 30, unit: 'min' })
    expect(timeUntil(new Date('2026-11-19T18:00:00'), now)).toEqual({ value: 6, unit: 'h' })
    expect(timeUntil(new Date('2026-11-22T12:00:00'), now)).toEqual({ value: 3, unit: 'd' })
  })
})

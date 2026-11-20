import { describe, expect, it } from 'vitest'
import { buildGarage } from '~/domain/garage'
import { mapICar } from '~/mappers/car'
import { mapIFix } from '~/mappers/fix'

const bmw = mapICar({ manufacturer: 'BMW', model: 'X1', productionYear: 2020, reference: 'cars/bmw' })

const skoda = mapICar({ manufacturer: 'Skoda', model: 'Fabia', productionYear: 2012, reference: 'cars/skoda' })

const fix = (ref: string, iso: string, extra: Parameters<typeof mapIFix>[0] = {}) =>
  mapIFix({ reference: `fixes/${ref}`, date: new Date(iso), ...extra })

describe('garage', () => {
  it('one tile per saved car plus one per one-off car; open repairs first', () => {
    const list = [
      fix('old', '2026-01-01T10:00:00', { carRef: 'cars/bmw', car: bmw, isClosed: true }),
      fix('next', '2026-12-01T10:00:00', { carRef: 'cars/bmw', car: bmw }),
      fix('soon', '2026-11-25T10:00:00', { carRef: 'cars/bmw', car: bmw }),
      fix('rental', '2026-10-01T10:00:00', { car: mapICar({ manufacturer: 'Fiat', model: '500', productionYear: 2019 }), isClosed: true }),
    ]
    const garage = buildGarage([skoda, bmw], list)
    expect(garage.map(t => t.car.model)).toEqual(['X1', '500', 'Fabia'])
    expect(garage[0]!.active.map(f => f.reference)).toEqual(['fixes/soon', 'fixes/next'])
    expect(garage[0]!.history.map(f => f.reference)).toEqual(['fixes/old'])
    expect(garage[1]!.saved).toBe(false)
    expect(garage[2]!.active).toEqual([])
  })

  it('a repair is never shown twice and deleted cars get no tile', () => {
    const same = fix('a', '2026-01-01T10:00:00', { carRef: 'cars/bmw', car: bmw })
    const garage = buildGarage([bmw, { ...skoda, deletedAt: new Date() }], [same, same])
    expect(garage).toHaveLength(1)
    expect(garage[0]!.active).toHaveLength(1)
  })
})

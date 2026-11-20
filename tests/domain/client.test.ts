import { describe, expect, it } from 'vitest'
import { buildClients } from '~/domain/client'
import { mapICar } from '~/mappers/car'
import { mapIFix } from '~/mappers/fix'

const d = (iso: string) => new Date(iso)

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

import { describe, expect, it } from 'vitest'
import { servicesBrand, slotProblem, upcomingWorkingDays } from '~/domain/workshop'
import { mapIWorkshop } from '~/mappers/workshop'

describe('servicesBrand', () => {
  const pinned = mapIWorkshop({ name: 'Pinned', city: 'krakow', location: { lat: 50.07, lng: 19.94 }, reference: 'companies/a' })

  it('empty brand list means all brands; match ignores case', () => {
    expect(servicesBrand(pinned, 'Skoda')).toBe(true)
    const german = mapIWorkshop({ brands: ['BMW', 'Audi'] })
    expect(servicesBrand(german, 'bmw')).toBe(true)
    expect(servicesBrand(german, 'Skoda')).toBe(false)
    expect(servicesBrand(german, '')).toBe(true)
  })
})

describe('booking slots', () => {
  // Mon–Fri, 8–16
  const workshop = mapIWorkshop({ openingTime: 8, closingTime: 16, workingDays: [1, 2, 3, 4, 5] })
  const now = new Date('2026-11-18T12:00:00') // Wednesday

  it('accepts a future full hour on a working day within opening hours', () => {
    expect(slotProblem(workshop, new Date('2026-11-19T09:00:00'), now)).toBeNull()
  })

  it('explains why a time cannot be booked', () => {
    expect(slotProblem(workshop, new Date('2026-11-18T10:00:00'), now)).toBe('slots.inPast')
    expect(slotProblem(workshop, new Date('2026-11-19T09:30:00'), now)).toBe('slots.fullHour')
    expect(slotProblem(workshop, new Date('2026-11-22T09:00:00'), now)).toBe('slots.closedDay') // Sunday
    expect(slotProblem(workshop, new Date('2026-11-19T16:00:00'), now)).toBe('slots.outsideHours')
    expect(slotProblem(workshop, new Date('invalid'), now)).toBe('rules.requiredRule')
  })

  it('lists upcoming working days, skipping closed ones', () => {
    const days = upcomingWorkingDays(workshop, new Date('2026-11-20T15:00:00'), 3) // Friday
    expect(days.map(d => d.getDay())).toEqual([5, 1, 2])
    expect(days[0]!.getHours()).toBe(0)
  })

  it('defaults to Monday–Saturday for companies without working days', () => {
    expect(mapIWorkshop({}).workingDays).toEqual([1, 2, 3, 4, 5, 6])
  })
})

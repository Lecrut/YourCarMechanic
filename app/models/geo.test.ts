import { describe, expect, it } from 'vitest'
import { distanceKm, placeWorkshop, rankWorkshops } from '~/domain/geo'
import { formatDistance } from '~/utils/format'
import { servicesBrand } from '~/domain/workshop'
import { mapIWorkshop } from '~/mappers/workshop'

const KRAKOW = { lat: 50.0614, lng: 19.9366 }
const WARSAW = { lat: 52.2297, lng: 21.0122 }
const cityCenter = (city: string) => ({ krakow: KRAKOW, warszawa: WARSAW } as Record<string, typeof KRAKOW>)[city] ?? null

const pinned = mapIWorkshop({ name: 'Pinned', city: 'krakow', location: { lat: 50.07, lng: 19.94 }, reference: 'companies/a' })
const inWarsaw = mapIWorkshop({ name: 'Warsaw', city: 'warszawa', reference: 'companies/b' })
const unknownCity = mapIWorkshop({ name: 'Nowhere', city: 'atlantyda', reference: 'companies/c' })

describe('geo', () => {
  it('distance Kraków – Warszawa is about 250 km', () => {
    expect(distanceKm(KRAKOW, WARSAW)).toBeGreaterThan(245)
    expect(distanceKm(KRAKOW, WARSAW)).toBeLessThan(260)
    expect(distanceKm(KRAKOW, KRAKOW)).toBe(0)
  })

  it('formats metres and kilometres', () => {
    expect(formatDistance(0.85)).toBe('900 m')
    expect(formatDistance(4.24)).toBe('4,2 km')
    expect(formatDistance(4.24, 'en')).toBe('4.2 km')
    expect(formatDistance(37.4)).toBe('37 km')
  })

  it('uses the pin, otherwise the city centre (approximate, stable), otherwise skips', () => {
    expect(placeWorkshop(pinned, cityCenter)).toMatchObject({ position: pinned.location, approximate: false })
    const a = placeWorkshop(inWarsaw, cityCenter)!
    expect(a.approximate).toBe(true)
    expect(distanceKm(a.position, WARSAW)).toBeLessThan(1.5)
    expect(placeWorkshop(inWarsaw, cityCenter)!.position).toEqual(a.position)
    expect(placeWorkshop(unknownCity, cityCenter)).toBeNull()
  })

  it('filters by radius and sorts by distance, rating or reviews', () => {
    const placed = [pinned, inWarsaw].map(w => placeWorkshop(w, cityCenter)!)
    const ratings = {
      'companies/a': { average: 4.2, count: 10 },
      'companies/b': { average: 4.9, count: 3 },
    }
    const near = rankWorkshops(placed, ratings, KRAKOW, 'distance', 50)
    expect(near.map(r => r.workshop.name)).toEqual(['Pinned'])

    const all = rankWorkshops(placed, ratings, KRAKOW, 'distance', null)
    expect(all.map(r => r.workshop.name)).toEqual(['Pinned', 'Warsaw'])
    expect(rankWorkshops(placed, ratings, KRAKOW, 'rating', null).map(r => r.workshop.name)).toEqual(['Warsaw', 'Pinned'])
    expect(rankWorkshops(placed, ratings, KRAKOW, 'reviews', null).map(r => r.workshop.name)).toEqual(['Pinned', 'Warsaw'])
  })

  it('without a location nothing is filtered out and distance is unknown', () => {
    const placed = [pinned, inWarsaw].map(w => placeWorkshop(w, cityCenter)!)
    const ranked = rankWorkshops(placed, {}, null, 'rating', 10)
    expect(ranked).toHaveLength(2)
    expect(ranked.every(r => r.distance === null)).toBe(true)
  })
})

describe('servicesBrand', () => {
  it('empty brand list means all brands; match ignores case', () => {
    expect(servicesBrand(pinned, 'Skoda')).toBe(true)
    const german = mapIWorkshop({ brands: ['BMW', 'Audi'] })
    expect(servicesBrand(german, 'bmw')).toBe(true)
    expect(servicesBrand(german, 'Skoda')).toBe(false)
    expect(servicesBrand(german, '')).toBe(true)
  })
})

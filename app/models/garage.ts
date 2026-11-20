import type { ICar } from '~/models/car'
import { fixesForCar, type IFix } from '~/models/fix'

/** One tile of the customer's garage: a car and its repairs. */
export interface IGarageCar {
  key: string
  car: ICar
  /** A car saved in the profile (can be edited, booked directly) vs a one-off car from a booking. */
  saved: boolean
  /** Open repairs, nearest first. */
  active: IFix[]
  /** Closed repairs, newest first. */
  history: IFix[]
}

const snapshotKey = (car: ICar) => `${car.manufacturer}|${car.model}|${car.productionYear}|${car.vin}`.toLowerCase()

/**
 * Groups repairs by car: every saved car gets a tile (also without repairs), repairs of other
 * cars are grouped by their snapshot. Each repair lands in exactly one tile. Cars with open
 * repairs come first, then by the latest visit.
 */
export function buildGarage(cars: ICar[], fixes: IFix[]): IGarageCar[] {
  const unique = [...new Map(fixes.map(f => [f.reference, f])).values()]
  const assigned = new Set<string>()
  const tile = (key: string, car: ICar, saved: boolean, list: IFix[]): IGarageCar => ({
    key,
    car,
    saved,
    active: list.filter(f => !f.isClosed).sort((a, b) => a.date.getTime() - b.date.getTime()),
    history: list.filter(f => f.isClosed).sort((a, b) => b.date.getTime() - a.date.getTime()),
  })

  const tiles = cars.filter(c => !c.deletedAt).map((car) => {
    const own = fixesForCar(unique, car).filter(f => !assigned.has(f.reference))
    own.forEach(f => assigned.add(f.reference))
    return tile(car.reference, car, true, own)
  })

  const others = new Map<string, IFix[]>()
  for (const fix of unique.filter(f => !assigned.has(f.reference))) {
    const key = snapshotKey(fix.car)
    others.set(key, [...(others.get(key) ?? []), fix])
  }
  for (const [key, list] of others) tiles.push(tile(`snapshot:${key}`, list[0]!.car, false, list))

  const lastVisit = (t: IGarageCar) => Math.max(0, ...[...t.active, ...t.history].map(f => f.date.getTime()))
  return tiles.sort((a, b) => Number(b.active.length > 0) - Number(a.active.length > 0) || lastVisit(b) - lastVisit(a))
}

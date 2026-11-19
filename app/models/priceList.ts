import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

/** Price segment of a car – parts for premium brands cost more than for economy ones. */
export type CarSegment = 'economy' | 'standard' | 'premium'

export const CAR_SEGMENTS: CarSegment[] = ['economy', 'standard', 'premium']

const PREMIUM_BRANDS = [
  'alfa romeo', 'aston martin', 'audi', 'bentley', 'bmw', 'cadillac', 'ferrari', 'genesis', 'infiniti', 'jaguar',
  'lamborghini', 'land rover', 'lexus', 'maserati', 'mercedes', 'mercedes-benz', 'mini', 'porsche', 'tesla', 'volvo',
]
const ECONOMY_BRANDS = ['dacia', 'fiat', 'lada', 'chevrolet', 'daewoo', 'suzuki', 'mg', 'ssangyong']

export function carSegment(brand: string): CarSegment {
  const b = brand.trim().toLowerCase()
  if (PREMIUM_BRANDS.includes(b)) return 'premium'
  if (ECONOMY_BRANDS.includes(b)) return 'economy'
  return 'standard'
}

export interface Range {
  min: number
  max: number
}

/** One row of a workshop's price list (`companies/{id}/priceList/{id}`). */
export interface IPriceListItem extends ISoftDeletable {
  /** Service key from the catalog this item belongs to. */
  serviceKey: string
  name: string
  laborHours: Range
  partsCost: Record<CarSegment, Range>

  reference: string
}

const toRange = (r?: Partial<Range>): Range => {
  const min = Math.max(0, Number(r?.min) || 0)
  return { min, max: Math.max(min, Number(r?.max) || 0) }
}

export function mapIPriceListItem(data: Partial<Omit<IPriceListItem, 'deletedAt'>> & { deletedAt?: unknown }): IPriceListItem {
  return {
    serviceKey: data.serviceKey || '',
    name: data.name || '',
    laborHours: toRange(data.laborHours),
    partsCost: {
      economy: toRange(data.partsCost?.economy),
      standard: toRange(data.partsCost?.standard),
      premium: toRange(data.partsCost?.premium),
    },
    deletedAt: toDeletedAt(data.deletedAt),
    reference: data.reference || '',
  }
}

/** Cost range of one item for a car segment: labor hours × hourly rate + parts. */
export function itemEstimate(item: IPriceListItem, hourlyRate: number, segment: CarSegment): Range {
  const parts = item.partsCost[segment]
  return {
    min: Math.round(item.laborHours.min * hourlyRate + parts.min),
    max: Math.round(item.laborHours.max * hourlyRate + parts.max),
  }
}

/**
 * Estimate for a booking: for every selected service take its price-list items and sum them.
 * Returns null when the workshop has no prices for at least one selected service.
 */
export function estimateRepair(
  items: IPriceListItem[],
  hourlyRate: number,
  services: string[],
  brand: string,
  /** Active promotions: service key → % off (see models/promotion.ts). */
  discounts: Record<string, number> = {},
): Range | null {
  const segment = carSegment(brand)
  let min = 0
  let max = 0
  for (const service of services) {
    const serviceItems = items.filter(i => i.serviceKey === service)
    if (!serviceItems.length) return null
    const factor = 1 - (discounts[service] ?? 0) / 100
    for (const item of serviceItems) {
      const e = itemEstimate(item, hourlyRate, segment)
      min += Math.round(e.min * factor)
      max += Math.round(e.max * factor)
    }
  }
  return { min, max }
}

export const isWithin = (value: number, range: Range) => value >= range.min && value <= range.max

export const formatRange = (r: Range) => (r.min === r.max ? `${r.min} PLN` : `${r.min} – ${r.max} PLN`)

/** Total of a quote line: labor hours × hourly rate + parts. */
export const quoteLineTotal = (laborHours: number, partsCost: number, hourlyRate: number) =>
  Math.round(Number(laborHours) * hourlyRate + Number(partsCost))

/** Times are entered and adjusted in 15-minute steps. */
export const TIME_STEP_HOURS = 0.25

export const roundUpToQuarter = (hours: number) => Math.ceil(Math.round(hours * 1000) / 250) / 4

/**
 * Expected visit length from the price list: the longest labor time of every item of the selected
 * services (a service without prices counts as 1 h), rounded up to 15 minutes.
 */
export function estimateDuration(items: IPriceListItem[], services: string[]): number {
  const total = services.reduce((sum, service) => {
    const serviceItems = items.filter(i => i.serviceKey === service)
    return sum + (serviceItems.length ? serviceItems.reduce((s, i) => s + i.laborHours.max, 0) : 1)
  }, 0)
  return Math.max(TIME_STEP_HOURS, roundUpToQuarter(total))
}

/** `1.25` → "1 h 15 min", `0.5` → "30 min", `2` → "2 h". */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min'
}

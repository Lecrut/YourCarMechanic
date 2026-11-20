import { toDeletedAt } from '~/mappers/softDelete'
import type { IPriceListItem, Range } from '~/types/priceList'

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

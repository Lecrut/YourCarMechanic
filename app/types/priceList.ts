import type { ISoftDeletable } from '~/types/softDelete'

/** Price segment of a car – parts for premium brands cost more than for economy ones. */
export type CarSegment = 'economy' | 'standard' | 'premium'

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

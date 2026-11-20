import type { ISoftDeletable } from '~/types/softDelete'

/** Time-limited discount of a workshop (`companies/{id}/promotions/{id}`). */
export interface IPromotion extends ISoftDeletable {
  title: string
  /** Service keys the discount applies to. */
  services: string[]
  /** 1–90 % off labor and parts of matching price-list items. */
  percent: number
  validFrom: Date
  /** Inclusive – the promotion lasts until the end of this day. */
  validTo: Date

  reference: string
}

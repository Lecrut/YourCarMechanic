import type { ISoftDeletable } from '~/types/softDelete'

export interface ICar extends ISoftDeletable {
  manufacturer: string
  model: string
  productionYear: number
  vin: string
  userRef: string

  reference: string
}

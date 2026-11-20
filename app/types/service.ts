import type { ISoftDeletable } from '~/types/softDelete'

export type ServiceCategory
  = | 'diagnostics'
    | 'mechanics'
    | 'brakesSuspension'
    | 'electrics'
    | 'bodyPaint'
    | 'tires'
    | 'glass'
    | 'other'

/** A repair type from the moderator-managed `services` collection. */
export interface IService extends ISoftDeletable {
  key: string
  namePl: string
  nameEn: string
  category: ServiceCategory
  active: boolean
  order: number
}

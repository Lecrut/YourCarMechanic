import type { IRatingSummary } from '~/types/review'
import type { IWorkshop } from '~/types/workshop'

export interface LatLng {
  lat: number
  lng: number
}

export interface PlacedWorkshop {
  workshop: IWorkshop
  position: LatLng
  /** True when the workshop has not pinned itself – position is its city centre. */
  approximate: boolean
}

export type WorkshopSort = 'distance' | 'rating' | 'reviews'

export interface RankedWorkshop extends PlacedWorkshop {
  distance: number | null
  rating: IRatingSummary
}

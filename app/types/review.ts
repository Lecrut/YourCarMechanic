import type { ISoftDeletable } from '~/types/softDelete'

/** Customer review of a finished repair (`reviews/{fixId}` – one review per fix). */
export interface IReview extends ISoftDeletable {
  companyRef: string
  fixRef: string
  userRef: string
  authorName: string
  rating: number
  comment: string
  createdAt: Date
  /** Hidden by a moderator – not shown publicly and not counted in the average. */
  hidden: boolean

  reference: string
}

export interface IRatingSummary {
  average: number
  count: number
}

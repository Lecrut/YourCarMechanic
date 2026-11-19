import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

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

export function mapIReview(data: Partial<Omit<IReview, 'createdAt' | 'deletedAt'>> & { createdAt?: Date | string, deletedAt?: unknown }): IReview {
  return {
    companyRef: data.companyRef || '',
    fixRef: data.fixRef || '',
    userRef: data.userRef || '',
    authorName: data.authorName || '',
    rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 1))),
    comment: data.comment || '',
    createdAt: new Date(data.createdAt ?? Date.now()),
    hidden: data.hidden ?? false,
    deletedAt: toDeletedAt(data.deletedAt),
    reference: data.reference || '',
  }
}

export interface IRatingSummary {
  average: number
  count: number
}

export function ratingSummary(reviews: IReview[]): IRatingSummary {
  const visible = reviews.filter(r => !r.hidden && !r.deletedAt)
  if (!visible.length) return { average: 0, count: 0 }
  const sum = visible.reduce((acc, r) => acc + r.rating, 0)
  return { average: Math.round((sum / visible.length) * 10) / 10, count: visible.length }
}

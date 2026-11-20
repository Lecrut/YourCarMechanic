import type { IRatingSummary, IReview } from '~/types/review'

export function ratingSummary(reviews: IReview[]): IRatingSummary {
  const visible = reviews.filter(r => !r.hidden && !r.deletedAt)
  if (!visible.length) return { average: 0, count: 0 }
  const sum = visible.reduce((acc, r) => acc + r.rating, 0)
  return { average: Math.round((sum / visible.length) * 10) / 10, count: visible.length }
}

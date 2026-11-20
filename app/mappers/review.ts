import { toDeletedAt } from '~/mappers/softDelete'
import type { IReview } from '~/types/review'

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

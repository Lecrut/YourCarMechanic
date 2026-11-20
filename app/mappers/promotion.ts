import { toDeletedAt } from '~/mappers/softDelete'
import type { IPromotion } from '~/types/promotion'

export function mapIPromotion(data: Partial<Omit<IPromotion, 'validFrom' | 'validTo' | 'deletedAt'>> & {
  validFrom?: Date | string
  validTo?: Date | string
  deletedAt?: unknown
}): IPromotion {
  return {
    title: data.title || '',
    services: [...(data.services ?? [])],
    percent: Math.min(90, Math.max(1, Math.round(Number(data.percent) || 10))),
    validFrom: new Date(data.validFrom ?? Date.now()),
    validTo: new Date(data.validTo ?? Date.now()),
    deletedAt: toDeletedAt(data.deletedAt),
    reference: data.reference || '',
  }
}

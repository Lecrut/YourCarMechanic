import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

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

/** Running at `at`: started, not past the end of `validTo`'s day, not deleted. */
export function isPromotionActive(p: IPromotion, at = new Date()): boolean {
  const end = new Date(p.validTo)
  end.setHours(23, 59, 59, 999)
  const start = new Date(p.validFrom)
  start.setHours(0, 0, 0, 0)
  return !p.deletedAt && at >= start && at <= end
}

/** Best active discount per service key, e.g. `{ tires: 20 }`. */
export function discountsAt(promotions: IPromotion[], at = new Date()): Record<string, number> {
  const result: Record<string, number> = {}
  for (const p of promotions) {
    if (!isPromotionActive(p, at)) continue
    for (const s of p.services) result[s] = Math.max(result[s] ?? 0, p.percent)
  }
  return result
}

/** The most generous active promotion touching any of `services` (for badges). */
export function bestPromotionFor(promotions: IPromotion[], services: string[], at = new Date()): IPromotion | null {
  return promotions
    .filter(p => isPromotionActive(p, at) && p.services.some(s => !services.length || services.includes(s)))
    .sort((a, b) => b.percent - a.percent)[0] ?? null
}

export const applyDiscount = (amount: number, percent: number) => Math.round(amount * (1 - percent / 100))

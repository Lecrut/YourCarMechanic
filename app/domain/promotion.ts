import type { IPromotion } from '~/types/promotion'

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

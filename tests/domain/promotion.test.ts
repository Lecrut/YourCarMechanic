import { describe, expect, it } from 'vitest'
import { estimateRepair } from '~/domain/priceList'
import { applyDiscount, bestPromotionFor, discountsAt, isPromotionActive } from '~/domain/promotion'
import { mapIPriceListItem } from '~/mappers/priceList'
import { mapIPromotion } from '~/mappers/promotion'

const promo = (percent: number, services: string[], from: string, to: string, extra = {}) =>
  mapIPromotion({ title: `-${percent}`, percent, services, validFrom: new Date(from), validTo: new Date(to), ...extra })

describe('promotions', () => {
  const now = new Date('2026-11-19T12:00:00')

  it('is active from the start of the first day to the end of the last day', () => {
    expect(isPromotionActive(promo(10, ['tires'], '2026-11-19T15:00:00', '2026-11-19T00:00:00'), now)).toBe(true)
    expect(isPromotionActive(promo(10, ['tires'], '2026-11-20T00:00:00', '2026-11-30T00:00:00'), now)).toBe(false)
    expect(isPromotionActive(promo(10, ['tires'], '2026-11-01T00:00:00', '2026-11-18T00:00:00'), now)).toBe(false)
    expect(isPromotionActive(promo(10, ['tires'], '2026-11-01T00:00:00', '2026-11-30T00:00:00', { deletedAt: now }), now)).toBe(false)
  })

  it('takes the best running discount per service', () => {
    const list = [
      promo(10, ['tires', 'oil'], '2026-11-01', '2026-11-30'),
      promo(25, ['tires'], '2026-11-10', '2026-11-25'),
      promo(50, ['oil'], '2026-12-01', '2026-12-31'),
    ]
    expect(discountsAt(list, now)).toEqual({ tires: 25, oil: 10 })
    expect(bestPromotionFor(list, ['oil'], now)?.percent).toBe(10)
    expect(bestPromotionFor(list, ['engine'], now)).toBeNull()
  })

  it('clamps the percent and applies discounts to estimates', () => {
    expect(mapIPromotion({ percent: 150 }).percent).toBe(90)
    expect(applyDiscount(200, 25)).toBe(150)
    const item = mapIPriceListItem({ serviceKey: 'tires', laborHours: { min: 1, max: 2 }, partsCost: { standard: { min: 0, max: 0 } } as never })
    expect(estimateRepair([item], 100, ['tires'], 'Skoda', { tires: 20 })).toEqual({ min: 80, max: 160 })
    expect(estimateRepair([item], 100, ['tires'], 'Skoda')).toEqual({ min: 100, max: 200 })
  })
})

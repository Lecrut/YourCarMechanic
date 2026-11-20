import { describe, expect, it } from 'vitest'
import { mapIPriceListItem } from '~/mappers/priceList'

describe('mapIPriceListItem', () => {
  it('never produces max < min or negative values', () => {
    const item = mapIPriceListItem({ laborHours: { min: 3, max: 1 }, partsCost: { economy: { min: -5, max: 10 } } as never })
    expect(item.laborHours).toEqual({ min: 3, max: 3 })
    expect(item.partsCost.economy).toEqual({ min: 0, max: 10 })
    expect(item.partsCost.premium).toEqual({ min: 0, max: 0 })
  })
})

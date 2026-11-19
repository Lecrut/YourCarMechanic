import { describe, expect, it } from 'vitest'
import { carSegment, estimateRepair, formatRange, isWithin, itemEstimate, mapIPriceListItem } from './priceList'

const oil = mapIPriceListItem({
  serviceKey: 'oil',
  name: 'Oil change',
  laborHours: { min: 0.5, max: 1 },
  partsCost: { economy: { min: 100, max: 150 }, standard: { min: 200, max: 300 }, premium: { min: 300, max: 450 } },
})
const tires = mapIPriceListItem({
  serviceKey: 'tires',
  name: 'Tires',
  laborHours: { min: 1, max: 1 },
  partsCost: { economy: { min: 0, max: 0 }, standard: { min: 0, max: 0 }, premium: { min: 0, max: 50 } },
})

describe('carSegment', () => {
  it('classifies brands case-insensitively', () => {
    expect(carSegment('BMW')).toBe('premium')
    expect(carSegment(' mercedes-benz ')).toBe('premium')
    expect(carSegment('Dacia')).toBe('economy')
    expect(carSegment('Skoda')).toBe('standard')
    expect(carSegment('')).toBe('standard')
  })
})

describe('itemEstimate', () => {
  it('is labor hours × rate + parts for the segment', () => {
    expect(itemEstimate(oil, 150, 'standard')).toEqual({ min: 275, max: 450 })
    expect(itemEstimate(oil, 150, 'premium')).toEqual({ min: 375, max: 600 })
  })
})

describe('estimateRepair', () => {
  it('sums all items of all selected services', () => {
    expect(estimateRepair([oil, tires], 100, ['oil', 'tires'], 'Skoda')).toEqual({ min: 350, max: 500 })
  })

  it('returns null when a selected service has no prices', () => {
    expect(estimateRepair([oil], 100, ['oil', 'engine'], 'Skoda')).toBeNull()
  })

  it('returns zero range for no services', () => {
    expect(estimateRepair([oil], 100, [], 'Skoda')).toEqual({ min: 0, max: 0 })
  })
})

describe('mapIPriceListItem', () => {
  it('never produces max < min or negative values', () => {
    const item = mapIPriceListItem({ laborHours: { min: 3, max: 1 }, partsCost: { economy: { min: -5, max: 10 } } as never })
    expect(item.laborHours).toEqual({ min: 3, max: 3 })
    expect(item.partsCost.economy).toEqual({ min: 0, max: 10 })
    expect(item.partsCost.premium).toEqual({ min: 0, max: 0 })
  })
})

describe('range helpers', () => {
  it('isWithin includes both ends', () => {
    expect(isWithin(100, { min: 100, max: 200 })).toBe(true)
    expect(isWithin(200, { min: 100, max: 200 })).toBe(true)
    expect(isWithin(201, { min: 100, max: 200 })).toBe(false)
  })

  it('formatRange collapses equal ends', () => {
    expect(formatRange({ min: 100, max: 100 })).toBe('100 PLN')
    expect(formatRange({ min: 100, max: 200 })).toBe('100 – 200 PLN')
  })
})

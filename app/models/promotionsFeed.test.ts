import { describe, expect, it } from 'vitest'
import { applyDiscount, bestPromotionFor, discountsAt, isPromotionActive } from '~/domain/promotion'
import { mapIPromotion } from '~/mappers/promotion'
import { estimateRepair, quoteLineTotal } from '~/domain/priceList'
import { mapIPriceListItem } from '~/mappers/priceList'
import { buildFeed, unreadCount } from '~/domain/feed'
import { formatRelative } from '~/utils/time'
import { canAcceptQuote, isQuoteAccepted } from '~/domain/fix'
import { mapIFix } from '~/mappers/fix'
import { mapINotification } from '~/mappers/notification'
import type { NotificationType } from '~/types/notification'
import { mapICar } from '~/mappers/car'

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

describe('quotes', () => {
  const s = (t: NotificationType) => mapINotification({ notificationType: t, cost: 100 })
  const fix = (types: NotificationType[]) => mapIFix({ notifications: types.map(s) })

  it('line total = hours × rate + parts', () => {
    expect(quoteLineTotal(1.5, 200, 150)).toBe(425)
  })

  it('a newer quote needs a new acceptance', () => {
    expect(isQuoteAccepted(fix(['getCar', 'addQuote', 'quoteAccepted']))).toBe(true)
    expect(isQuoteAccepted(fix(['getCar', 'addQuote', 'quoteAccepted', 'addQuote']))).toBe(false)
    expect(canAcceptQuote(fix(['getCar', 'addQuote']))).toBe(true)
    expect(canAcceptQuote(fix(['getCar']))).toBe(false)
  })
})

describe('notification feed', () => {
  const at = (iso: string) => new Date(iso)
  const n = (notificationType: NotificationType, iso: string) => mapINotification({ notificationType, sendDate: at(iso), cost: 300 })
  const fix = mapIFix({
    reference: 'fixes/1',
    bookDate: at('2026-11-10T10:00:00'),
    car: mapICar({ manufacturer: 'Skoda', model: 'Fabia' }),
    clientName: 'Anna',
    notifications: [n('getCar', '2026-11-12T10:00:00'), n('addQuote', '2026-11-12T12:00:00'), n('quoteAccepted', '2026-11-12T13:00:00')],
  })

  it('shows clients what the workshop did, newest first', () => {
    const feed = buildFeed([fix], 'user')
    expect(feed.map(e => e.type)).toEqual(['addQuote', 'getCar'])
    expect(feed[0]).toMatchObject({ car: 'Skoda Fabia', cost: 300 })
  })

  it('shows workshops new bookings and client decisions', () => {
    expect(buildFeed([fix], 'workshop').map(e => e.type)).toEqual(['quoteAccepted', 'newBooking'])
    expect(buildFeed([fix], 'moderator')).toEqual([])
  })

  it('counts unread since last seen and formats relative time', () => {
    const feed = buildFeed([fix], 'user')
    expect(unreadCount(feed, null)).toBe(2)
    expect(unreadCount(feed, at('2026-11-12T11:00:00'))).toBe(1)
    const now = at('2026-11-12T12:00:00')
    expect(formatRelative(at('2026-11-12T11:59:50'), 'pl', now)).toBe('teraz')
    expect(formatRelative(at('2026-11-12T11:15:00'), 'pl', now)).toBe('45 minut temu')
    expect(formatRelative(at('2026-11-12T07:00:00'), 'pl', now)).toBe('5 godzin temu')
    expect(formatRelative(at('2026-11-11T09:00:00'), 'pl', now)).toBe('wczoraj')
    expect(formatRelative(at('2026-11-09T12:00:00'), 'pl', now)).toBe('3 dni temu')
    expect(formatRelative(at('2026-11-12T11:59:00'), 'en', now)).toBe('1 minute ago')
  })
})

describe('feed after a review', () => {
  it('stops asking for a review once it was given', () => {
    const base = {
      reference: 'fixes/r',
      notifications: [mapINotification({ notificationType: 'giveBackCar', sendDate: new Date('2026-11-12T10:00:00') })],
    }
    expect(buildFeed([mapIFix(base)], 'user')[0]!.type).toBe('giveBackCar')
    expect(buildFeed([mapIFix({ ...base, reviewed: true })], 'user')[0]!.type).toBe('giveBackCarReviewed')
  })
})

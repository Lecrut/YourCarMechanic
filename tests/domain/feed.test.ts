import { describe, expect, it } from 'vitest'
import { buildFeed, unreadCount } from '~/domain/feed'
import { nextVisit } from '~/domain/fix'
import { mapICar } from '~/mappers/car'
import { mapIFix } from '~/mappers/fix'
import { mapINotification } from '~/mappers/notification'
import type { NotificationType } from '~/types/notification'
import { formatRelative } from '~/utils/time'

describe('next visit and reminders', () => {
  const now = new Date('2026-11-19T12:00:00')
  const visit = (iso: string, extra = {}) => mapIFix({ reference: `fixes/${iso}`, date: new Date(iso), bookDate: new Date('2026-11-01T10:00:00'), ...extra })

  it('next visit is the nearest confirmed, open, future one', () => {
    const list = [visit('2026-11-25T10:00:00'), visit('2026-11-21T10:00:00'), visit('2026-11-20T09:00:00', { confirmed: false }), visit('2026-11-18T10:00:00')]
    expect(nextVisit(list, now)?.reference).toBe('fixes/2026-11-21T10:00:00')
    expect(nextVisit([], now)).toBeNull()
  })

  it('reminds both sides within 24 h before a confirmed visit', () => {
    const tomorrow = visit('2026-11-20T10:00:00')
    const later = visit('2026-11-22T10:00:00')
    const unconfirmed = visit('2026-11-20T11:00:00', { confirmed: false })
    for (const role of ['user', 'workshop'] as const) {
      const reminders = buildFeed([tomorrow, later, unconfirmed], role, 30, now).filter(e => e.type === 'reminder')
      expect(reminders.map(e => e.fixRef)).toEqual(['fixes/2026-11-20T10:00:00'])
      expect(reminders[0]!.at).toEqual(new Date('2026-11-19T10:00:00'))
    }
  })

  it('time until a visit – grammatical, calendar days', () => {
    expect(formatRelative(new Date('2026-11-19T12:30:00'), 'pl', now)).toBe('za 30 minut')
    expect(formatRelative(new Date('2026-11-19T18:00:00'), 'pl', now)).toBe('za 6 godzin')
    expect(formatRelative(new Date('2026-11-20T10:00:00'), 'pl', now)).toBe('jutro')
    expect(formatRelative(new Date('2026-11-21T10:00:00'), 'pl', now)).toBe('pojutrze')
    expect(formatRelative(new Date('2026-11-22T12:00:00'), 'pl', now)).toBe('za 3 dni')
    expect(formatRelative(new Date('2026-11-20T10:00:00'), 'en', now)).toBe('tomorrow')
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

import { describe, expect, it } from 'vitest'
import { isOnDay, lastStatus, mapIFix, matchesSearch, statusColor, totalCost } from './fix'
import { buildWeek, carsAtWorkshop } from './week'
import { mapIWorkshop } from './workshop'
import { mapICar } from './car'
import { mapINotification, type NotificationType } from './notification'
import { toIcs } from '../utils/calendar'

const s = (notificationType: NotificationType, cost?: number) => mapINotification({ notificationType, cost })

const fix = (date: string, extra: Parameters<typeof mapIFix>[0] = {}) => mapIFix({
  date: new Date(date),
  bookDate: new Date('2026-11-01T09:00:00'),
  car: mapICar({ manufacturer: 'Skoda', model: 'Octavia', vin: 'TMBJJ7NE8L0123456' }),
  clientName: 'Anna Kowalska',
  clientPhone: '600100200',
  description: 'Stuki w zawieszeniu',
  reference: `fixes/${date}`,
  ...extra,
})

describe('repair helpers', () => {
  it('total cost = latest quote + expenses', () => {
    expect(totalCost(fix('2026-11-20T10:00:00'))).toBeNull()
    expect(totalCost(fix('2026-11-20T10:00:00', { notifications: [s('addQuote', 300), s('addQuote', 400), s('addExpense', 50)] }))).toBe(450)
  })

  it('last status and colour', () => {
    const f = fix('2026-11-20T10:00:00', { notifications: [s('getCar')] })
    expect(lastStatus(f)?.notificationType).toBe('getCar')
    expect(statusColor(f)).toBe('primary')
    expect(statusColor(fix('2026-11-20T10:00:00'))).toBe('info')
    expect(statusColor(fix('2026-11-20T10:00:00', { confirmed: false }))).toBe('warning')
  })

  it('search matches client, phone, car, VIN and description', () => {
    const f = fix('2026-11-20T10:00:00')
    for (const q of ['anna', '600100', 'octavia', 'tmbjj', 'stuki', '']) expect(matchesSearch(f, q)).toBe(true)
    expect(matchesSearch(f, 'bmw')).toBe(false)
  })

  it('isOnDay compares calendar days', () => {
    expect(isOnDay(fix('2026-11-20T10:00:00'), new Date('2026-11-20T23:00:00'))).toBe(true)
    expect(isOnDay(fix('2026-11-20T10:00:00'), new Date('2026-11-21T00:00:00'))).toBe(false)
  })
})

describe('week board', () => {
  const workshop = mapIWorkshop({ openingTime: 8, closingTime: 12, workingDays: [1, 2, 3, 4, 5] })
  const monday = new Date('2026-11-16T07:00:00')

  it('places visits by day and hour, marks today and closed days', () => {
    const week = buildWeek([fix('2026-11-16T09:00:00'), fix('2026-11-18T11:00:00'), fix('2026-11-30T09:00:00')], workshop, monday, 7, new Date('2026-11-18T08:00:00'))
    expect(week.hours).toEqual([8, 9, 10, 11])
    expect(week.days).toHaveLength(7)
    expect(week.days[0]!.cells[1]).toHaveLength(1) // Monday 9:00
    expect(week.days[2]!.cells[3]).toHaveLength(1) // Wednesday 11:00
    expect(week.days[2]!.isToday).toBe(true)
    expect(week.days[5]!.isWorking).toBe(false) // Saturday
    expect(week.days.flatMap(d => d.cells.flat())).toHaveLength(2) // the 30th is outside the week
  })

  it('extends the hours when a visit is outside opening hours', () => {
    expect(buildWeek([fix('2026-11-17T14:00:00')], workshop, monday).hours).toEqual([8, 9, 10, 11, 12, 13, 14])
  })

  it('cars at the workshop are received and not finished', () => {
    const received = fix('2026-11-16T09:00:00', { notifications: [s('getCar')] })
    const returned = fix('2026-11-16T10:00:00', { notifications: [s('getCar'), s('giveBackCar')], isClosed: true })
    expect(carsAtWorkshop([received, returned, fix('2026-11-17T09:00:00')])).toEqual([received])
  })
})

describe('calendar export', () => {
  it('produces a valid, escaped VEVENT', () => {
    const ics = toIcs({
      uid: 'fixes-1@test',
      title: 'Wizyta: AutoFix, Kraków',
      start: new Date('2030-01-07T10:00:00Z'),
      durationMinutes: 60,
      location: 'ul. Długa 5; Kraków',
    }, new Date('2030-01-01T00:00:00Z'))
    expect(ics).toContain('DTSTART:20300107T100000Z')
    expect(ics).toContain('DTEND:20300107T110000Z')
    expect(ics).toContain('SUMMARY:Wizyta: AutoFix\\, Kraków')
    expect(ics).toContain('LOCATION:ul. Długa 5\\; Kraków')
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
  })
})

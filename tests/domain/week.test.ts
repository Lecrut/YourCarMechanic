import { describe, expect, it } from 'vitest'
import { buildWeek, carsAtWorkshop } from '~/domain/week'
import { mapICar } from '~/mappers/car'
import { mapIFix } from '~/mappers/fix'
import { mapINotification } from '~/mappers/notification'
import { mapIWorkshop } from '~/mappers/workshop'
import type { NotificationType } from '~/types/notification'

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

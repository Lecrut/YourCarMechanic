import { type IFix, isFixFinished } from '~/models/fix'
import { type IWorkshop, isWorkingDay, occupiedHours } from '~/models/workshop'

/** A visit in one hour cell; `continued` marks hours after the first one of a longer visit. */
export interface IWeekEntry {
  fix: IFix
  continued: boolean
}

export interface IWeekDay {
  day: Date
  isToday: boolean
  isWorking: boolean
  /** Entries per hour row (same order as `IWeek.hours`). */
  cells: IWeekEntry[][]
}

export interface IWeek {
  hours: number[]
  days: IWeekDay[]
}

/**
 * Calendar board for `days` days from `from`: one row per opening hour (extended if a visit
 * falls outside opening hours, so nothing is hidden), one column per day. Visits longer than an
 * hour fill every hour they occupy – also on the following working days.
 */
export function buildWeek(fixes: IFix[], workshop: IWorkshop, from: Date, days = 7, now = new Date()): IWeek {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + days)

  const placed = fixes.flatMap((fix) => {
    const hours = occupiedHours(workshop, fix.date, fix.durationHours)
    // A visit booked outside opening hours (old data) is shown at its real time, not moved.
    const startHour = new Date(fix.date)
    startHour.setMinutes(0, 0, 0)
    if (hours[0]?.getTime() !== startHour.getTime()) hours.splice(0, 1, startHour)
    return hours
      .map((hour, index) => ({ fix, hour, continued: index > 0 }))
      .filter(e => e.hour >= start && e.hour < end)
  })

  const visitHours = placed.map(e => e.hour.getHours())
  const first = Math.min(workshop.openingTime, ...visitHours)
  const last = Math.max(workshop.closingTime - 1, ...visitHours)
  const hours = Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => first + i)

  return {
    hours,
    days: Array.from({ length: days }, (_, i) => {
      const day = new Date(start)
      day.setDate(day.getDate() + i)
      const ofDay = placed.filter(e => e.hour.toDateString() === day.toDateString())
      return {
        day,
        isToday: day.toDateString() === now.toDateString(),
        isWorking: isWorkingDay(workshop, day),
        cells: hours.map(hour => ofDay
          .filter(e => e.hour.getHours() === hour)
          .map(({ fix, continued }) => ({ fix, continued }))),
      }
    }),
  }
}

/** Cars currently at the workshop: received and not handed back or cancelled. */
export const carsAtWorkshop = (fixes: IFix[]) =>
  fixes
    .filter(f => !f.isClosed && !isFixFinished(f) && f.notifications.some(n => n.notificationType === 'getCar'))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

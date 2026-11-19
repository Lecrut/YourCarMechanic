import { type IFix, isFixFinished } from '~/models/fix'
import { type IWorkshop, isWorkingDay } from '~/models/workshop'

export interface IWeekDay {
  day: Date
  isToday: boolean
  isWorking: boolean
  /** Repairs per hour row (same order as `IWeek.hours`). */
  cells: IFix[][]
}

export interface IWeek {
  hours: number[]
  days: IWeekDay[]
}

/**
 * Calendar board for `days` days from `from`: one row per opening hour (extended if a visit
 * falls outside opening hours, so nothing is hidden), one column per day.
 */
export function buildWeek(fixes: IFix[], workshop: IWorkshop, from: Date, days = 7, now = new Date()): IWeek {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + days)

  const inRange = fixes.filter(f => f.date >= start && f.date < end)
  const visitHours = inRange.map(f => f.date.getHours())
  const first = Math.min(workshop.openingTime, ...visitHours)
  const last = Math.max(workshop.closingTime - 1, ...visitHours)
  const hours = Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => first + i)

  return {
    hours,
    days: Array.from({ length: days }, (_, i) => {
      const day = new Date(start)
      day.setDate(day.getDate() + i)
      const ofDay = inRange.filter(f => f.date.toDateString() === day.toDateString())
      return {
        day,
        isToday: day.toDateString() === now.toDateString(),
        isWorking: isWorkingDay(workshop, day),
        cells: hours.map(hour => ofDay.filter(f => f.date.getHours() === hour)),
      }
    }),
  }
}

/** Cars currently at the workshop: received and not handed back or cancelled. */
export const carsAtWorkshop = (fixes: IFix[]) =>
  fixes
    .filter(f => !f.isClosed && !isFixFinished(f) && f.notifications.some(n => n.notificationType === 'getCar'))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

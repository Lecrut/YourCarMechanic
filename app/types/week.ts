import type { IFix } from '~/types/fix'

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

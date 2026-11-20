export type FixOutcome = 'inProgress' | 'finished' | 'cancelled'

export interface IWorkshopStats {
  companyRef: string
  repairs: number
  finished: number
  avgRepairHours: number | null
  avgRating: number | null
  quotesTotal: number
}

export interface IStats {
  total: number
  byOutcome: Record<FixOutcome, number>
  cancelRate: number
  avgRepairHours: number | null
  avgWaitHours: number | null
  quotesTotal: number
  /** Repairs per month for the last 12 months (oldest first), by visit date. */
  perMonth: { month: Date, count: number }[]
  topServices: { key: string, count: number }[]
  workshops: IWorkshopStats[]
}

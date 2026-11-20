export type NotificationType
  = | 'getCar'
    | 'addGiveBackTime'
    | 'addExpense'
    | 'giveBackCar'
    | 'userCancel'
    | 'workshopCancel'
    | 'addQuote'
    | 'quoteAccepted'
    | 'moderatorCancel'
    | 'changeProposed'
    | 'changeAccepted'
    | 'changeRejected'
    | 'bookingConfirmed'
    | 'rescheduled'

/** One line of an itemised quote (built from the workshop's price list). */
export interface IQuoteItem {
  name: string
  laborHours: number
  partsCost: number
  /** laborHours × hourly rate + partsCost, rounded. */
  total: number
}

export interface INotification {
  sendDate: Date
  notificationType: NotificationType
  cost: number | null
  description: string
  date: Date
  /** Only for `addQuote` – empty for quotes given as a single amount. */
  items: IQuoteItem[]
}

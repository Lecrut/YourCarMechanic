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

/** Notifications after which a repair is considered finished. */
export const CLOSING_NOTIFICATIONS: NotificationType[] = ['giveBackCar', 'userCancel', 'workshopCancel', 'moderatorCancel']

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

type NotificationInput = Partial<Omit<INotification, 'sendDate' | 'date' | 'items'>> & {
  sendDate?: Date | string
  date?: Date | string
  items?: Partial<IQuoteItem>[]
}

const mapItem = (i: Partial<IQuoteItem>): IQuoteItem => ({
  name: i.name || '',
  laborHours: Number(i.laborHours) || 0,
  partsCost: Number(i.partsCost) || 0,
  total: Number(i.total) || 0,
})

export function mapINotification(data: NotificationInput): INotification {
  return {
    sendDate: new Date(data.sendDate ?? Date.now()),
    notificationType: data.notificationType || 'getCar',
    cost: data.cost == null ? null : Number(data.cost),
    description: data.description || '',
    date: new Date(data.date ?? Date.now()),
    items: (data.items ?? []).map(mapItem),
  }
}

/** Notifications are stored with ISO strings (kept for compatibility with existing data). */
export function mapINotificationToFirebase(data: INotification) {
  return {
    sendDate: new Date().toISOString(),
    notificationType: data.notificationType,
    cost: data.cost == null ? null : Number(data.cost),
    description: data.description || '',
    date: data.date.toISOString(),
    ...(data.items.length ? { items: data.items.map(mapItem) } : {}),
  }
}

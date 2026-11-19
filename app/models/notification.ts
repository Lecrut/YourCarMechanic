export type NotificationType
  = | 'getCar'
    | 'addGiveBackTime'
    | 'addExpense'
    | 'giveBackCar'
    | 'userCancel'
    | 'workshopCancel'
    | 'addQuote'
    | 'moderatorCancel'
    | 'changeProposed'
    | 'changeAccepted'
    | 'changeRejected'
    | 'bookingConfirmed'

/** Notifications after which a repair is considered finished. */
export const CLOSING_NOTIFICATIONS: NotificationType[] = ['giveBackCar', 'userCancel', 'workshopCancel', 'moderatorCancel']

export interface INotification {
  sendDate: Date
  notificationType: NotificationType
  cost: number | null
  description: string
  date: Date
}

export function mapINotification(data: Partial<Omit<INotification, 'sendDate' | 'date'>> & { sendDate?: Date | string, date?: Date | string }): INotification {
  return {
    sendDate: new Date(data.sendDate ?? Date.now()),
    notificationType: data.notificationType || 'getCar',
    cost: data.cost == null ? null : Number(data.cost),
    description: data.description || '',
    date: new Date(data.date ?? Date.now()),
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
  }
}

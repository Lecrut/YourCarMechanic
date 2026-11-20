import type { INotification, IQuoteItem } from '~/types/notification'

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

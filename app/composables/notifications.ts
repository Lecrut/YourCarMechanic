import type { NotificationType } from '~/models/notification'
import type { ViewerMode } from '~/models/fix'

type Translate = (key: string) => string
type Option = { title: string, value: NotificationType }

export const notificationLabel = (t: Translate, type: NotificationType) => t(`fixStatues.${type}`)

const toOptions = (t: Translate, types: NotificationType[]): Option[] =>
  types.map(value => ({ title: notificationLabel(t, value), value }))

/**
 * Statuses the viewer may add. A visit booked by the workshop can only be cancelled
 * until the client confirms it.
 */
export function statusOptions(t: Translate, mode: ViewerMode, carReceived: boolean, confirmed = true): Option[] {
  if (mode === 'moderator')
    return toOptions(t, ['getCar', 'addQuote', 'addGiveBackTime', 'addExpense', 'giveBackCar', 'moderatorCancel'])
  if (mode === 'workshop' && !confirmed)
    return toOptions(t, ['workshopCancel'])
  if (mode === 'workshop')
    return toOptions(t, carReceived
      ? ['addGiveBackTime', 'addExpense', 'giveBackCar']
      : ['getCar', 'workshopCancel'])
  return []
}

import type { NotificationType } from '~/types/notification'

/** Notifications after which a repair is considered finished. */
export const CLOSING_NOTIFICATIONS: NotificationType[] = ['giveBackCar', 'userCancel', 'workshopCancel', 'moderatorCancel']

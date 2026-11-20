import { CONTACT_CATEGORIES, CONTACT_STATUSES } from '~/domain/contactMessage'
import { toDeletedAt } from '~/mappers/softDelete'
import type { ContactCategory, ContactStatus, IContactMessage } from '~/types/contactMessage'

export function mapIContactMessage(data: Partial<Omit<IContactMessage, 'createdAt' | 'deletedAt'>> & {
  createdAt?: Date | string
  deletedAt?: unknown
}): IContactMessage {
  return {
    name: data.name || '',
    email: data.email || '',
    category: CONTACT_CATEGORIES.includes(data.category as ContactCategory) ? data.category as ContactCategory : 'other',
    subject: data.subject || '',
    message: data.message || '',
    userRef: data.userRef || '',
    status: CONTACT_STATUSES.includes(data.status as ContactStatus) ? data.status as ContactStatus : 'new',
    moderatorNote: data.moderatorNote || '',
    createdAt: new Date(data.createdAt ?? Date.now()),
    deletedAt: toDeletedAt(data.deletedAt),
    reference: data.reference || '',
  }
}

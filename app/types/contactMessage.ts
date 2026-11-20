import type { CONTACT_CATEGORIES, CONTACT_STATUSES } from '~/domain/contactMessage'
import type { ISoftDeletable } from '~/types/softDelete'

export type ContactCategory = typeof CONTACT_CATEGORIES[number]

export type ContactStatus = typeof CONTACT_STATUSES[number]

/** Message sent from the contact form (`contactMessages/{id}`), handled by moderators. */
export interface IContactMessage extends ISoftDeletable {
  name: string
  email: string
  category: ContactCategory
  subject: string
  message: string
  /** Signed-in sender, empty for guests. */
  userRef: string
  status: ContactStatus
  /** Internal note of the moderator handling it. */
  moderatorNote: string
  createdAt: Date

  reference: string
}

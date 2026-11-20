import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

export const CONTACT_CATEGORIES = ['general', 'booking', 'workshop', 'account', 'bug', 'other'] as const
export type ContactCategory = typeof CONTACT_CATEGORIES[number]

export const CONTACT_STATUSES = ['new', 'inProgress', 'resolved'] as const
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

/** Limits shared by the form and firestore.rules. */
export const CONTACT_LIMITS = { name: 100, subject: 150, messageMin: 10, messageMax: 5000 } as const

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

/** Messages a moderator still has to deal with. */
export const isOpen = (m: IContactMessage) => !m.deletedAt && m.status !== 'resolved'

/** `mailto:` link answering the sender, quoting the original message. */
export function replyLink(m: IContactMessage, subjectPrefix = 'Re:'): string {
  const subject = `${subjectPrefix} ${m.subject || m.category}`
  const body = `\n\n---\n${m.name} <${m.email}>, ${m.createdAt.toLocaleString()}:\n${m.message}`
  return `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

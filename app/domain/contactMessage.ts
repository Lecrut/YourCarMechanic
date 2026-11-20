import type { IContactMessage } from '~/types/contactMessage'

export const CONTACT_CATEGORIES = ['general', 'booking', 'workshop', 'account', 'bug', 'other'] as const

export const CONTACT_STATUSES = ['new', 'inProgress', 'resolved'] as const

/** Limits shared by the form and firestore.rules. */
export const CONTACT_LIMITS = { name: 100, subject: 150, messageMin: 10, messageMax: 5000 } as const

/** Messages a moderator still has to deal with. */
export const isOpen = (m: IContactMessage) => !m.deletedAt && m.status !== 'resolved'

/** `mailto:` link answering the sender, quoting the original message. */
export function replyLink(m: IContactMessage, subjectPrefix = 'Re:'): string {
  const subject = `${subjectPrefix} ${m.subject || m.category}`
  const body = `\n\n---\n${m.name} <${m.email}>, ${m.createdAt.toLocaleString()}:\n${m.message}`
  return `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

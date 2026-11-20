import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './mappers'
import { restore, softDelete } from './softDelete'
import { type ContactCategory, type ContactStatus, type IContactMessage, mapIContactMessage } from '~/models/contactMessage'

const messages = () => collection(db(), 'contactMessages')

export interface ContactInput {
  name: string
  email: string
  category: ContactCategory
  subject: string
  message: string
  userRef: string
}

/** Anyone (also guests) can send a message; only moderators can read them (firestore.rules). */
export async function sendContactMessage(input: ContactInput): Promise<void> {
  await addDoc(messages(), {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    userRef: input.userRef || null,
    status: 'new',
    moderatorNote: '',
    createdAt: serverTimestamp(),
  })
}

// Moderator only:

/** New messages arrive while the moderator looks at the list – watched live. */
export function watchContactMessages(onChange: (list: IContactMessage[]) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    query(messages(), orderBy('createdAt', 'desc')),
    snap => onChange(fromQuery<IContactMessage>(snap).map(mapIContactMessage)),
    onError,
  )
}

export const setContactStatus = (messageRef: string, status: ContactStatus) =>
  updateDoc(doc(db(), messageRef), { status })

export const setContactNote = (messageRef: string, moderatorNote: string) =>
  updateDoc(doc(db(), messageRef), { moderatorNote })

export const deleteContactMessage = (messageRef: string) => softDelete(messageRef)
export const restoreContactMessage = (messageRef: string) => restore(messageRef)

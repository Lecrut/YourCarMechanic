import { contactService } from '~/services'
import type { ContactInput } from '~/services/contactService'
import { type ContactStatus, type IContactMessage, isOpen } from '~/models/contactMessage'
import { createSubscription } from '~/utils/subscription'

/** Contact form (everyone) and the moderator's inbox. */
export const useContactStore = defineStore('contact', () => {
  const messages = ref<IContactMessage[]>([])
  const sharedStore = useSharedStore()
  const subscription = createSubscription()

  const openCount = computed(() => messages.value.filter(isOpen).length)
  const newCount = computed(() => messages.value.filter(m => !m.deletedAt && m.status === 'new').length)

  const send = (input: ContactInput) => sharedStore.run(() => contactService.sendContactMessage(input))

  function watchInbox() {
    subscription.start(() => contactService.watchContactMessages(
      (list) => {
        messages.value = list
      },
      e => sharedStore.fail(e),
    ))
  }

  function stopWatching() {
    subscription.stop()
  }

  const isWatching = () => subscription.active

  function resetState() {
    stopWatching()
    messages.value = []
  }

  // Updates come back through the live listener – no local patching needed.
  const setStatus = (m: IContactMessage, status: ContactStatus) =>
    sharedStore.run(() => contactService.setContactStatus(m.reference, status))
  const saveNote = (m: IContactMessage, note: string) =>
    sharedStore.run(() => contactService.setContactNote(m.reference, note.trim()))
  const remove = (m: IContactMessage) => sharedStore.run(() => contactService.deleteContactMessage(m.reference))
  const restore = (m: IContactMessage) => sharedStore.run(() => contactService.restoreContactMessage(m.reference))

  return { messages, isWatching, openCount, newCount, send, watchInbox, stopWatching, resetState, setStatus, saveNote, remove, restore }
})

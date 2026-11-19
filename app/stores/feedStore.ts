import { fixesService } from '~/services'
import type { IFix } from '~/models/fix'
import { buildFeed, unreadCount } from '~/models/feed'
import { addDays } from '~/utils/time'
import { createSubscription } from '~/utils/subscription'

const FEED_DAYS = 30
const seenKey = (userRef: string) => `feed-seen:${userRef}`

/** Notification centre: recent repairs watched live, turned into events; "seen" is per browser. */
export const useFeedStore = defineStore('feed', () => {
  const fixes = ref<IFix[]>([])
  const lastSeen = ref<Date | null>(null)
  const userRef = ref('')

  const authStore = useAuthStore()
  const subscription = createSubscription()

  const events = computed(() => buildFeed(fixes.value, authStore.role))
  const unread = computed(() => unreadCount(events.value, lastSeen.value))

  function start() {
    const user = authStore.user
    const field = authStore.role === 'user' ? 'userRef' : authStore.role === 'workshop' ? 'companyRef' : null
    const ownerRef = field === 'userRef' ? user?.reference : authStore.company?.reference
    if (!user || !field || !ownerRef) return stop()

    userRef.value = user.reference
    try {
      const saved = localStorage.getItem(seenKey(user.reference))
      lastSeen.value = saved ? new Date(saved) : null
    }
    catch {
      lastSeen.value = null
    }

    subscription.start(() => fixesService.watchRecentFixes(
      field,
      ownerRef,
      addDays(new Date(), -FEED_DAYS),
      (list) => {
        fixes.value = list
      },
      e => console.error(e), // the bell must never break the page
    ))
  }

  function stop() {
    subscription.stop()
    fixes.value = []
  }

  function markAllRead() {
    lastSeen.value = new Date()
    try {
      localStorage.setItem(seenKey(userRef.value), lastSeen.value.toISOString())
    }
    catch {
      // storage unavailable – unread count resets on reload
    }
  }

  const fixByRef = (fixRef: string) => fixes.value.find(f => f.reference === fixRef) ?? null

  return { fixes, events, unread, lastSeen, start, stop, markAllRead, fixByRef }
})

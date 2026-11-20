import { onBeforeRouteLeave } from 'vue-router'

/**
 * Live data of the moderator panel (users, companies, repairs, reviews, contact inbox).
 * Every moderator page calls it: the listeners start once and keep running while moving between
 * moderator pages, and stop when the moderator leaves the panel (logout stops them too).
 */
export function useModeratorLive(start = true) {
  const moderatorStore = useModeratorStore()
  const reviewsStore = useReviewsStore()
  const contactStore = useContactStore()
  const servicesStore = useServicesStore()

  onMounted(() => {
    if (!start) return
    if (!moderatorStore.isWatching()) moderatorStore.watchAll()
    if (!reviewsStore.isWatching()) reviewsStore.watchAll()
    if (!contactStore.isWatching()) contactStore.watchInbox()
    servicesStore.load(true)
  })

  onBeforeRouteLeave((to) => {
    if (to.path.startsWith('/moderator')) return
    moderatorStore.stopWatching()
    reviewsStore.stopWatching()
    contactStore.stopWatching()
  })
}

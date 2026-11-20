import { reviewsService } from '~/services'
import type { IFix } from '~/models/fix'
import { type IRatingSummary, type IReview, ratingSummary } from '~/models/review'
import { createSubscription } from '~/utils/subscription'

export const useReviewsStore = defineStore('reviews', () => {
  /** All reviews – loaded by the moderator panel only. */
  const all = ref<IReview[]>([])
  /** Rating of the signed-in workshop. */
  const ownRating = ref<IRatingSummary | null>(null)
  const sharedStore = useSharedStore()
  const subscription = createSubscription()

  function watchAll() {
    subscription.start(() => reviewsService.watchAllReviews(
      list => (all.value = list),
      e => sharedStore.fail(e),
    ))
  }

  function stopWatching() {
    subscription.stop()
  }

  const isWatching = () => subscription.active

  const addReview = (fix: IFix, rating: number, comment: string) =>
    sharedStore.run(async () => {
      const { user } = useAuthStore()
      const author = user?.profile ? `${user.profile.name} ${user.profile.surname.charAt(0)}.` : ''
      const review = await reviewsService.addReview(fix, rating, comment, author)
      useFixesStore().markReviewed(fix.reference)
      return review
    })

  async function loadOwnRating(companyRef: string) {
    try {
      ownRating.value = ratingSummary(await reviewsService.getReviewsForWorkshops([companyRef]))
    }
    catch (e) {
      // A missing rating must not break the dashboard.
      console.error(e)
    }
  }

  const loadAll = () =>
    sharedStore.run(async () => {
      all.value = await reviewsService.getAllReviews()
    })

  const patch = (review: IReview, changes: Partial<IReview>) => {
    all.value = all.value.map(r => (r.reference === review.reference ? { ...r, ...changes } : r))
  }

  const setHidden = (review: IReview, hidden: boolean) =>
    sharedStore.run(async () => {
      await reviewsService.setReviewHidden(review.reference, hidden)
      patch(review, { hidden })
    })

  const remove = (review: IReview) =>
    sharedStore.run(async () => {
      await reviewsService.deleteReview(review.reference)
      patch(review, { deletedAt: new Date(), hidden: true })
    })

  const restore = (review: IReview) =>
    sharedStore.run(async () => {
      await reviewsService.restoreReview(review.reference)
      patch(review, { deletedAt: null })
    })

  return { all, isWatching, ownRating, addReview, loadOwnRating, loadAll, watchAll, stopWatching, setHidden, remove, restore }
})

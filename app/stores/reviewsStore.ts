import { reviewsService } from '~/services'
import type { IFix } from '~/models/fix'
import type { IReview } from '~/models/review'

export const useReviewsStore = defineStore('reviews', () => {
  /** All reviews – loaded by the moderator panel only. */
  const all = ref<IReview[]>([])
  const sharedStore = useSharedStore()

  const addReview = (fix: IFix, rating: number, comment: string) =>
    sharedStore.run(async () => {
      const { user } = useAuthStore()
      const author = user?.profile ? `${user.profile.name} ${user.profile.surname.charAt(0)}.` : ''
      const review = await reviewsService.addReview(fix, rating, comment, author)
      useFixesStore().markReviewed(fix.reference)
      return review
    })

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

  return { all, addReview, loadAll, setHidden, remove, restore }
})

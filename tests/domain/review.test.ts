import { describe, expect, it } from 'vitest'
import { ratingSummary } from '~/domain/review'
import { mapIReview } from '~/mappers/review'

describe('ratingSummary', () => {
  it('rating summary ignores hidden and deleted reviews', () => {
    const reviews = [
      mapIReview({ rating: 5 }),
      mapIReview({ rating: 1, hidden: true }),
      mapIReview({ rating: 1, deletedAt: new Date() }),
      mapIReview({ rating: 4 }),
    ]
    expect(ratingSummary(reviews)).toEqual({ average: 4.5, count: 2 })
  })
})

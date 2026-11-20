import { describe, expect, it } from 'vitest'
import { notDeleted } from '~/domain/softDelete'
import { mapICar } from '~/mappers/car'

describe('soft delete', () => {
  it('notDeleted filters soft-deleted records', () => {
    const cars = [mapICar({ model: 'A' }), mapICar({ model: 'B', deletedAt: new Date() })]
    expect(notDeleted(cars).map(c => c.model)).toEqual(['A'])
  })
})

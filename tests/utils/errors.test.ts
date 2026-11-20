import { describe, expect, it } from 'vitest'
import { AppError, errorKey } from '~/utils/errors'

describe('errorKey', () => {
  it('maps domain and Firebase errors to messages', () => {
    expect(errorKey(new AppError('errors.slotTaken'))).toBe('errors.slotTaken')
    expect(errorKey({ code: 'auth/invalid-credential' })).toBe('errors.invalidCredentials')
    expect(errorKey({ code: 'permission-denied' })).toBe('errors.permissionDenied')
    expect(errorKey({ code: 'firestore/unavailable' })).toBe('errors.offline')
    expect(errorKey({ code: 'something/else' })).toBe('universal.error')
    expect(errorKey(new Error('boom'))).toBe('universal.error')
  })
})

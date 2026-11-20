import { describe, expect, it } from 'vitest'
import { isValidNip, isValidPhone, isValidVin, maxLengthRule, productionYearRule, requiredRule } from './rules'
import { AppError, errorKey } from './errors'
import { slotProblem, upcomingWorkingDays } from '~/domain/workshop'
import { mapIWorkshop } from '~/mappers/workshop'

const t = (key: string) => key

describe('field rules', () => {
  it('NIP requires 10 digits with a valid checksum', () => {
    expect(isValidNip('5260259950')).toBe(true)
    expect(isValidNip('526-025-99-50')).toBe(true)
    expect(isValidNip('5260259951')).toBe(false)
    expect(isValidNip('abcd')).toBe(false)
    expect(isValidNip('')).toBe(false)
  })

  it('phone accepts 9 digits with optional +48, spaces and dashes', () => {
    expect(isValidPhone('600100200')).toBe(true)
    expect(isValidPhone('600 100 200')).toBe(true)
    expect(isValidPhone('+48 600-100-200')).toBe(true)
    expect(isValidPhone('60010020')).toBe(false)
    expect(isValidPhone('+49600100200')).toBe(false)
  })

  it('VIN has 17 characters without I, O, Q', () => {
    expect(isValidVin('WBA8E9G50JNU12345')).toBe(true)
    expect(isValidVin(' wba8e9g50jnu12345 ')).toBe(true)
    expect(isValidVin('WBA8E9G50JNU1234')).toBe(false)
    expect(isValidVin('WBA8E9G50JNO12345')).toBe(false)
  })

  it('required accepts 0 but not empty values', () => {
    const rule = requiredRule(t)
    expect(rule(0)).toBe(true)
    expect(rule('x')).toBe(true)
    expect(rule('')).toBe('rules.requiredRule')
    expect(rule(null)).toBe('rules.requiredRule')
  })

  it('max length and production year', () => {
    expect(maxLengthRule(t, 3)('abc')).toBe(true)
    expect(maxLengthRule(t, 3)('abcd')).toBe('rules.maxLength')
    expect(productionYearRule(t)(2015)).toBe(true)
    expect(productionYearRule(t)(1850)).toBe('rules.productionYearRule')
    expect(productionYearRule(t)(new Date().getFullYear() + 1)).toBe('rules.productionYearRule')
  })
})

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

describe('booking slots', () => {
  // Mon–Fri, 8–16
  const workshop = mapIWorkshop({ openingTime: 8, closingTime: 16, workingDays: [1, 2, 3, 4, 5] })
  const now = new Date('2026-11-18T12:00:00') // Wednesday

  it('accepts a future full hour on a working day within opening hours', () => {
    expect(slotProblem(workshop, new Date('2026-11-19T09:00:00'), now)).toBeNull()
  })

  it('explains why a time cannot be booked', () => {
    expect(slotProblem(workshop, new Date('2026-11-18T10:00:00'), now)).toBe('slots.inPast')
    expect(slotProblem(workshop, new Date('2026-11-19T09:30:00'), now)).toBe('slots.fullHour')
    expect(slotProblem(workshop, new Date('2026-11-22T09:00:00'), now)).toBe('slots.closedDay') // Sunday
    expect(slotProblem(workshop, new Date('2026-11-19T16:00:00'), now)).toBe('slots.outsideHours')
    expect(slotProblem(workshop, new Date('invalid'), now)).toBe('rules.requiredRule')
  })

  it('lists upcoming working days, skipping closed ones', () => {
    const days = upcomingWorkingDays(workshop, new Date('2026-11-20T15:00:00'), 3) // Friday
    expect(days.map(d => d.getDay())).toEqual([5, 1, 2])
    expect(days[0]!.getHours()).toBe(0)
  })

  it('defaults to Monday–Saturday for companies without working days', () => {
    expect(mapIWorkshop({}).workingDays).toEqual([1, 2, 3, 4, 5, 6])
  })
})

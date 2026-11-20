import { describe, expect, it } from 'vitest'
import { isValidNip, isValidPhone, isValidVin, maxLengthRule, productionYearRule, requiredRule } from '~/utils/rules'

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

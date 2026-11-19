// Vuetify field rules: each returns `true` or an error message.
type Translate = (key: string) => string

const emailPattern
  = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

/** Polish number: 9 digits, optional +48 / 0048, spaces and dashes allowed. */
const phonePattern = /^(?:\+48|0048)?\d{9}$/

/** 17 characters, no I, O or Q (ISO 3779). */
const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7]

/** Polish tax id (NIP) checksum. Accepts dashes/spaces. */
export function isValidNip(value: string): boolean {
  const digits = (value ?? '').replace(/[\s-]/g, '')
  if (!/^\d{10}$/.test(digits)) return false
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0)
  return sum % 11 === Number(digits[9])
}

export const isValidPhone = (value: string) => phonePattern.test((value ?? '').replace(/[\s-]/g, ''))

export const isValidVin = (value: string) => vinPattern.test((value ?? '').trim().toUpperCase())

export function requiredRule(t: Translate) {
  // 0 is a valid value for numeric fields (e.g. an opening hour).
  return (value: string | number | null | undefined) =>
    (value !== null && value !== undefined && value !== '') || t('rules.requiredRule')
}

export function requiredArrayRule(t: Translate) {
  return (value: string | unknown[] | null) => Boolean(value?.length) || t('rules.requiredRule')
}

export function emailRule(t: Translate) {
  return (value: string) => emailPattern.test(value) || t('rules.emailRule')
}

export function phoneRule(t: Translate) {
  return (value: string) => isValidPhone(value) || t('rules.phoneRule')
}

export function passwordRule(t: Translate) {
  return (value: string) => (value?.length ?? 0) >= 12 || t('rules.passwordRule')
}

export function nipRule(t: Translate) {
  return (value: string) => isValidNip(value) || t('rules.nipRule')
}

export function vinRule(t: Translate) {
  return (value: string) => isValidVin(value) || t('rules.vinRule')
}

export function maxLengthRule(t: Translate, max: number) {
  return (value: string | null) => (value ?? '').length <= max || t('rules.maxLength')
}

export function productionYearRule(t: Translate) {
  return (value: string | number) => {
    const year = Number.parseInt(String(value), 10)
    return (year <= new Date().getFullYear() && year >= 1900) || t('rules.productionYearRule')
  }
}

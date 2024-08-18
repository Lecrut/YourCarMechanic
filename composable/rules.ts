const emailPattern
    = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const registerPattern = /^[A-Za-z]$/

export function requiredRule(t: (arg0: string) => string) {
  return (value: string | number | null, textError = t('rules.requiredRule') ) => {
    return Boolean(value) || textError
  }
}

export function emailRule(t: (arg0: string) => string) {
  return (value: string, textError = t('rules.emailRule')) => {
    return emailPattern.test(value) || textError
  }
}

export function passwordRule(t: (arg0: string) => string) {
  return (value: string, textError = t('rules.passwordRule')) => {
    return Boolean(value?.length >= 12)  || textError
  }
}

export function lengthRuleShort(t: (arg0: string) => string) {
  return (value: string | string[], textError = t('rules.lengthRuleShort')) => {
    return Boolean(value?.length > 3) || textError
  }
}

export function lengthRule(t: (arg0: string) => string) {
  return (value: string | string[], textError = t('rules.lengthRule')) => {
    return Boolean(value?.length <= 10) || textError
  }
}

export function firstSignRule(t: (arg0: string) => string) {
  return (value: string, textError = t('rules.firstSignRule')) => {
    return Boolean(registerPattern.test(value?.charAt(0))) || textError
  }
}

export function registerLengthRule(t: (arg0: string) => string) {
  return (value: string, textError = t('rules.registerLengthRule')) => {
    return Boolean(value?.length <= 9 && value?.length > 3) || textError
  }
}

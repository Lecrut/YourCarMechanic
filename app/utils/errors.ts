/** Domain error whose message is an i18n key (e.g. `errors.slotTaken`). */
export class AppError extends Error {
  constructor(public readonly key: string) {
    super(key)
    this.name = 'AppError'
  }
}

/** Firebase error codes → i18n keys shown to the user. */
const FIREBASE_CODES: Record<string, string> = {
  'auth/invalid-credential': 'errors.invalidCredentials',
  'auth/wrong-password': 'errors.invalidCredentials',
  'auth/user-not-found': 'errors.invalidCredentials',
  'auth/invalid-email': 'errors.invalidEmail',
  'auth/email-already-in-use': 'errors.emailTaken',
  'auth/weak-password': 'errors.weakPassword',
  'auth/too-many-requests': 'errors.tooManyRequests',
  'auth/network-request-failed': 'errors.offline',
  'auth/user-disabled': 'errors.accountDisabled',
  'permission-denied': 'errors.permissionDenied',
  'unavailable': 'errors.offline',
  'not-found': 'errors.notFound',
  'aborted': 'errors.conflict',
  'failed-precondition': 'errors.conflict',
}

/** Turns anything thrown by a service into an i18n key for the global error snackbar. */
export function errorKey(error: unknown): string {
  if (error instanceof AppError) return error.key
  const code = (error as { code?: unknown } | null)?.code
  if (typeof code === 'string') return FIREBASE_CODES[code] ?? FIREBASE_CODES[code.replace(/^firestore\//, '')] ?? 'universal.error'
  return 'universal.error'
}

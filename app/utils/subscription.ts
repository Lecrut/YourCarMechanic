/** Holds at most one active Firestore listener; starting a new one stops the previous. */
export function createSubscription() {
  let unsubscribe: (() => void) | null = null

  return {
    start(subscribe: () => () => void) {
      unsubscribe?.()
      unsubscribe = subscribe()
    },
    stop() {
      unsubscribe?.()
      unsubscribe = null
    },
    /** True while a listener is running. */
    get active() {
      return unsubscribe !== null
    },
  }
}

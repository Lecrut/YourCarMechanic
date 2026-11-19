export const useSharedStore = defineStore('shared', () => {
  const loading = ref(false)
  const error = ref(false)

  /**
   * Runs an async action with global loading/error tracking.
   * Returns the action's result, or `null` when it threw.
   */
  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    error.value = false
    loading.value = true
    try {
      return await action()
    }
    catch (e) {
      console.error(e)
      error.value = true
      return null
    }
    finally {
      loading.value = false
    }
  }

  /** For errors reported outside `run()` (e.g. by a realtime listener). */
  function fail(e: unknown) {
    console.error(e)
    error.value = true
    loading.value = false
  }

  function resetState() {
    error.value = false
    loading.value = false
  }

  return { loading, error, run, fail, resetState }
})

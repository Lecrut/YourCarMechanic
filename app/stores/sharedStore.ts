import { errorKey } from '~/utils/errors'

/**
 * Global loading/error state. Errors are shown by the single snackbar in layouts/default.vue,
 * so components never render their own error snackbars.
 */
export const useSharedStore = defineStore('shared', () => {
  const loading = ref(false)
  const error = ref(false)
  /** i18n key of the last error message. */
  const errorMessage = ref('universal.error')

  function fail(e: unknown) {
    console.error(e)
    errorMessage.value = errorKey(e)
    error.value = true
    loading.value = false
  }

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
      fail(e)
      return null
    }
    finally {
      loading.value = false
    }
  }

  function resetState() {
    error.value = false
    loading.value = false
  }

  return { loading, error, errorMessage, run, fail, resetState }
})

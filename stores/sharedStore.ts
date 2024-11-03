import type {Ref} from "vue";

export const useSharedStore = defineStore('shared', () => {
    const loading: Ref<boolean> = ref(false)
    const error: Ref<boolean> = ref(false)


    const init = () => {
        error.value = false
        loading.value = true
    }

    const success = () => {
        error.value = false
        loading.value = false
    }

    const failure = () => {
        error.value = true
        loading.value = false
    }

    const resetState = () => {
        error.value = false
        loading.value = false
    }

    return {
        loading,
        error,

        init,
        success,
        failure,

        resetState,
    }
})

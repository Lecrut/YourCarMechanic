import {type IFix, mapIFix} from "~/models/fix";
import type {Ref} from "vue";
import type {IUser} from "~/models/user";
import type {IWorkshop} from "~/models/workshop";

export const useFixesStore = defineStore('fixes', () => {
    const fixes: Ref<IFix[]> = ref([])

    const sharedStore = useSharedStore()
    const resetState = () => {
        fixes.value = []
    }

    const getWorkshopFixes = async (company: IWorkshop) => {
        sharedStore.init()

        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'get-workshop-fixes', {
                query: {companyRef: company.reference},
                method: 'POST',
            }) as unknown as IFix[]
            if (data.value) {
                fixes.value = data.value.map(mapIFix)
                sharedStore.success()
            } else {
                sharedStore.failure()
            }
        } catch (e) {
            sharedStore.failure()
        }
    }

    const getUserFixes = async (user: IUser) => {
        sharedStore.init()

        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'get-user-fixes', {
                query: {userRef: user.reference},
                method: 'POST',
            }) as unknown as IFix[]
            if (data.value) {
                fixes.value = data.value.map(mapIFix)
                sharedStore.success()
            } else {
                sharedStore.failure()
            }
        } catch (e) {
            sharedStore.failure()
        }
    }

    const addFix = async (fix: IFix) => {

    }

    return {
        fixes,
        getUserFixes,
        addFix,
        resetState,
        getWorkshopFixes,
    }
}, {persist: true})
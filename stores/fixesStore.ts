import {type IFix, mapIFix, mapIFixToFirebase} from "~/models/fix";
import type {Ref} from "vue";
import type {IUser} from "~/models/user";
import type {IWorkshop} from "~/models/workshop";
import {type INotification, mapINotificationToFirebase} from "~/models/notification";

const authApiUrl = "http://localhost:5050/"

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

            // todo: check date map
            // todo: get only active fixes

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

            // todo: check date map
            // todo: get only active

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
        sharedStore.init()

        try {
            const queryParam = encodeURIComponent(JSON.stringify(mapIFixToFirebase(fix)))
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'add-fix', {
                query: {fix: queryParam},
                method: 'POST',
            }) as unknown as IFix

            if (data.value) {
                fixes.value = [...fixes.value, mapIFix(data.value)]
                sharedStore.success()
            } else {
                sharedStore.failure()
            }
        } catch (e) {
            sharedStore.failure()
        }
    }

    const addNotification = async (fix: IFix, notification: INotification) => {
        sharedStore.init()

        try {
            const queryParam = encodeURIComponent(JSON.stringify(mapINotificationToFirebase(notification)))

            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'add-notification', {
                query: {
                    fix: fix.reference,
                    notification: queryParam,
                },
                method: 'POST',
            }) as unknown as IFix

            if (data.value) {
                const newFix = mapIFix(data.value)
                fixes.value = fixes.value.map(tempFix => tempFix.reference === newFix.reference ? newFix : tempFix);
                sharedStore.success()
            } else {
                sharedStore.failure()
            }

        } catch (e) {
            sharedStore.failure()
        }
    }

    const getUserHistoryFixes = async (user: IUser) => {
        //     todo: write get historical user fixes
    }


    return {
        fixes,
        getUserFixes,
        addFix,
        resetState,
        getWorkshopFixes,
        addNotification,
        getUserHistoryFixes,
    }
}, {persist: true})
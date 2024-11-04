import {defineStore} from "pinia";
import {type IUser, mapIUser} from "~/models/user";
import type {Ref} from "vue";
import type {IUserProfile} from "~/models/userProfile";
import {type IWorkshop, mapIWorkshop} from "~/models/workshop";
import {useSharedStore} from "~/stores/sharedStore";

const authApiUrl = "http://localhost:5050/"


export const useAuthStore = defineStore('auth', () => {
    const user: Ref<IUser | null> = ref(null)
    const company: Ref<IWorkshop | null> = ref(null)

    const sharedStore = useSharedStore()

    const resetState = () => {
        company.value = null
        user.value = null
    }

    function setUser(newUser: IUser) {
        user.value = mapIUser(newUser)
    }

    function setCompany(newCompany: IWorkshop) {
        company.value = mapIWorkshop(newCompany)
    }

    const logIn = async (userEmail: string, userPassword: string) => {
        sharedStore.init()
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'log-in', {
                query: {email: userEmail, password: userPassword},
                method: 'POST',
            }) as unknown as IUser

            if (data.value) {
                setUser({...data.value})
                sharedStore.success()
            } else
                sharedStore.failure()
        } catch (e) {
            sharedStore.failure()
        }
    }

    const signUp = async (userEmail: string, userPassword1: string, userPassword2: string) => {
        sharedStore.init()

        try {
            if (userPassword1 !== userPassword2) {
                sharedStore.failure()
                return
            }

            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'sign-up', {
                query: {email: userEmail, password: userPassword1},
                method: 'POST',
            }) as unknown as IUser

            if (data.value) {
                setUser({...data.value})
                sharedStore.success()
            } else
                sharedStore.failure()
        } catch (e) {
            sharedStore.failure()
        }
    }

    const logOut = () => {
        sharedStore.resetState()
        resetState()
    }

    const resetPassword = async (userEmail: string) => {
        sharedStore.init()
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'reset-password', {
                query: {email: userEmail},
                method: 'POST',
            })

            data.value ? sharedStore.success() : sharedStore.failure()

        } catch (e) {
            sharedStore.failure()
        }
    }

    const updateUserProfile = async (userData: IUserProfile) => {
        sharedStore.init()
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'sign-up', {
                query: {...userData, reference: user.value?.reference || ''},
                method: 'POST',
            }) as unknown as IUser

            if (data.value)
                setUser(data.value)
            else
                sharedStore.failure()

        } catch (e) {
            sharedStore.failure()
        }
    }

    const createCompany = async (workshopData: IWorkshop) => {
        sharedStore.init()
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'add-company', {
                query: {...workshopData},
                method: 'POST',
            }) as unknown as IWorkshop

            if (data.value)
                setCompany(data.value)
            else
                sharedStore.failure()
        } catch (e) {
            sharedStore.failure()
        }
    }

    const updateCompany = (data: IWorkshop) => {

    }

    return {
        user,
        company,
        logIn,
        signUp,
        logOut,
        resetPassword,
        resetState,
        updateUserProfile,
        createCompany,
        updateCompany,
    }
})
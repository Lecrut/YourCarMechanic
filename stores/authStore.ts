import {defineStore} from "pinia";
import {type IUser, mapIUser} from "~/models/user";
import type {Ref} from "vue";
import type {IUserProfile} from "~/models/userProfile";
import type {IWorkshop} from "~/models/workshop";
import {useSharedStore} from "~/stores/sharedStore";

const authApiUrl = "http://localhost:5050/"


export const useAuthStore = defineStore('auth', () => {
    const user: Ref<IUser | null> = ref(null)
    const company: Ref<IWorkshop | null> = ref(null)

    const sharedStore = useSharedStore()

    const resetState = () => {
        user.value = null
    }

    function setUser(newUser: IUser) {
        user.value = newUser
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
        resetState()
    }

    const updateUserProfile = async (userData: IUserProfile) => {
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'update-user', {
                query: {...userData, reference: user.value?.reference || ''},
                method: 'POST',
            }) as unknown as IUser
            console.log('aaa', data.value)
            if (data.value)
                setUser(data.value)

        } catch (e) {
            console.log(e)
        }
    }

    const createCompany = (data: IWorkshop) => {

    }

    const updateCompany = (data: IWorkshop) => {

    }

    return {
        user,
        company,
        logIn,
        signUp,
        logOut,
        resetState,
        updateUserProfile,
        createCompany,
        updateCompany,
    }
})
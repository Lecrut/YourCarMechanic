import {defineStore} from "pinia";
import {type IUser, mapIUser} from "~/models/user";
import type {Ref} from "vue";
import type {IUserProfile} from "~/models/userProfile";
import type {IWorkshop} from "~/models/workshop";

const authApiUrl = "http://localhost:5050/"


export const useAuthStore = defineStore('auth', () => {
    const user: Ref<IUser | null> = ref(null)
    const company: Ref<IWorkshop | null> = ref(null)
    const loginError: Ref<Boolean> = ref(false)
    const registerError: Ref<Boolean> = ref(false)

    const resetState = () => {
        user.value = null
        loginError.value = false
        registerError.value = false
    }

    function setUser(newUser: IUser) {
        user.value = newUser
    }

    const logIn = async (userEmail: string, userPassword: string) => {
        loginError.value = false
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'log-in', {
                query: {email: userEmail, password: userPassword},
                method: 'POST',
            }) as unknown as IUser

            data.value ? setUser({...data.value}) : loginError.value = true
        } catch (e) {
            loginError.value = true
        }
    }

    const signUp = async (userEmail: string, userPassword: string) => {
        registerError.value = false
        try {
            // @ts-ignore
            const {data} = await useFetch(authApiUrl + 'sign-up', {
                query: {email: userEmail, password: userPassword},
                method: 'POST',
            }) as unknown as IUser

            data.value ? setUser({...data.value}) : registerError.value = true
        } catch (e) {
            console.log(e)
            registerError.value = true
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
        loginError,
        registerError,
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
import {defineStore} from "pinia";
import {UserModel} from "~/models/user";
import type {Ref} from "vue";
import type {userProfile} from "~/models/userProfile";
import type {WorkshopModel} from "~/models/workshop";

export const useAuthStore = defineStore('auth', () => {
    const user: Ref<UserModel | null> = ref(null)

    const resetState = () => {
        user.value = null
    }

    const logIn = (email: string, password: string) => {

    }

    const logOut = () => {
        resetState()
    }

    const updateUserProfile = (data: userProfile) => {

    }

    const createCompany = (data: WorkshopModel) => {

    }

    const updateCompany = (data: WorkshopModel) => {

    }

    return {
        user,
        logIn,
        logOut,
        resetState,
        updateUserProfile,
        createCompany,
        updateCompany,
    }
})
import {type IUserProfile, mapIUserProfile} from "~/models/userProfile";

export interface IUser {
    email: string
    role: string
    profile: IUserProfile | null
    company: string

    reference: string
}

export function mapIUser(data: IUser): IUser {
    return {
        email: data.email || "",
        role: data.role || "",
        profile: mapIUserProfile({...data.profile} as IUserProfile),
        company: data.company || "",

        reference: data.reference || ""
    }
}

export function mapIUserToFirebase(data: IUser) {
    return {
        email: data.email || "",
        role: data.role || "",
        profile: mapIUserProfile({...data.profile} as IUserProfile),
        company: data.company || "",
    }
}
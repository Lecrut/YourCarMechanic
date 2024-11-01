import {type IUserProfile, mapIUserProfile} from "~/models/userProfile";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

export interface IUser {
    email: string
    role: string
    profile: IUserProfile | null
    company: DocumentReference | null

    reference: string | null
}

export function mapIUser(data: IUser): IUser {
    return {
        email: data.email || "",
        role: data.role || "",
        profile: mapIUserProfile({...data.profile} as IUserProfile),
        company: data.company || null,

        reference: data.reference || ""
    }
}

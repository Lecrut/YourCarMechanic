import type {userProfile} from "~/models/userProfile";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

export interface User {
    email: string
    role: string
    profile: userProfile | null
    company: DocumentReference | null
}

export class UserModel {
    email: string
    role: string
    profile: userProfile | null
    company: DocumentReference | null

    constructor(data: User) {
        this.email = data.email || ""
        this.role = data.role || ""
        this.profile = data.profile || null
        this.company = data.company || null
    }

    toMap() {
        return {
            email: this.email,
            role: this.role,
            profile: this.profile || null,
            company: this.company || null,
        }
    }
}
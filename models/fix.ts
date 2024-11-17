import type {INotification} from "~/models/notification";

export interface IFix {
    date: Date,

    companyRef: string,
    carRef: string,
    userRef: string,

    services: string[],
    description: string

    notifications: INotification[]

    reference: string
}
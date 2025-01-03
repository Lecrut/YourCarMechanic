import {type INotification, mapINotification} from "~/models/notification";
import {type ICar, mapICar} from "~/models/car";

export interface IFix {
    date: Date,
    bookDate: Date,

    companyRef: string,
    car: ICar,
    carMillage: number,
    userRef: string,

    services: string[],
    description: string
    clientPhone: string

    notifications: INotification[]

    isClosed: boolean

    reference: string
}

export function mapIFix(data: IFix): IFix {
    return {
        date: new Date(data.date),
        bookDate: new Date(data.bookDate),

        companyRef: data.companyRef || "",
        car: mapICar({...data.car}),
        carMillage: Number(data.carMillage || 0),
        userRef: data.userRef || "",

        services: [...data.services],
        description: data.description || "",
        clientPhone: data.clientPhone || "",

        notifications: [...data.notifications.map(mapINotification)],

        isClosed: data.isClosed || false,

        reference: data.reference || "",
    }
}

export function mapIFixToFirebase(data: IFix) {
    return {
        date: data.date.toISOString(),
        bookDate: data.bookDate.toISOString(),

        companyRef: data.companyRef || "",
        car: mapICar({...data.car}),
        carMillage: Number(data.carMillage || 0),
        userRef: data.userRef || "",

        services: [...data.services],
        description: data.description || "",
        clientPhone: data.clientPhone || "",

        notifications: [...data.notifications.map(mapINotification)],

        isClosed: data.isClosed || false
    }
}
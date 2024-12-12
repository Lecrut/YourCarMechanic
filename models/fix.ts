import {type INotification, mapINotification} from "~/models/notification";
import {type ICar, mapICar} from "~/models/car";

// todo: add client phone
export interface IFix {
    date: Date,
    bookDate: Date,

    companyRef: string,
    car: ICar,
    carMillage: number,
    userRef: string,

    services: string[],
    description: string

    notifications: INotification[]

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

        notifications: [...data.notifications.map(mapINotification)],

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

        notifications: [...data.notifications.map(mapINotification)],

    }
}
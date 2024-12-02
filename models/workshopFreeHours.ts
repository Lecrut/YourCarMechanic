import type {IWorkshop} from "~/models/workshop";

export interface IWorkshopHours {
    workshop: IWorkshop
    data: IFreeHours[]
}

export interface IFreeHours {
    day: string,
    hours: {
        hour: number
        isBooked: boolean
    }[]
}

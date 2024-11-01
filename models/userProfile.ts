export interface IUserProfile {
    name: string | null
    surname: string | null
    phone: string | null
}

export function mapIUserProfile(data: IUserProfile): IUserProfile {
    return {
        name: data.name || "",
        surname: data.surname || "",
        phone: data.phone || ""
    }
}
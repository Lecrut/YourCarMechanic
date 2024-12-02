export interface IWorkshop {
    name: string
    nip: string
    closingTime: number,
    openingTime: number,
    city: string,
    services: string[],
    phone: string,
    address: string

    reference: string
}

// todo: add working days
export function mapIWorkshop(data: IWorkshop): IWorkshop {
    return {
        name: data.name || "",
        nip: data.nip || "",
        closingTime: Number(data.closingTime),
        openingTime: Number(data.openingTime),
        city: data.city || "",
        services: data.services || [],
        phone: data.phone || "",
        address: data.address || "",

        reference: data.reference || "",
    }
}

export function mapIWorkshopToFirebase(data: IWorkshop) {
    return {
        name: data.name || "",
        nip: data.nip || "",
        closingTime: Number(data.closingTime),
        openingTime: Number(data.openingTime),
        city: data.city || "",
        services: data.services,
        phone: data.phone,
        address: data.address,
    }
}

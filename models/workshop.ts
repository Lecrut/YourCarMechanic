export interface Workshop {
    name: string
    nip: string
    closingTime: number,
    openingTime: number,
    city: string,
    services: string[],
    phone: string,
    address: string
}

export class WorkshopModel {
    name: string
    nip: string
    closingTime: number
    openingTime: number
    city: string
    services: string[]
    phone: string
    address: string

    constructor(data: Workshop) {
        this.name = data.name || ""
        this.nip = data.nip || ""
        this.closingTime = Number(data.closingTime)
        this.openingTime = Number(data.openingTime)
        this.city = data.city || ""
        this.services = data.services
        this.phone = data.phone
        this.address = data.address
    }

    toMap() {
        return {
            name: this.name,
            nip: this.nip,
            closingTime: this.closingTime,
            openingTime: this.openingTime,
            city: this.city,
            services: this.services,
            phone: this.phone,
            address: this.address,
        }
    }
}
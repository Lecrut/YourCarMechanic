export interface ICar {
    manufacturer: string
    model: string
    productionYear: number
    vin: string | null
    user: string | null

    reference: string
}

export function mapICar(data: ICar): ICar {
    return {
        manufacturer: data.manufacturer || "",
        model: data.model || "",
        productionYear: data.productionYear || 1900,
        vin: data.vin || "",
        user: data.user || "",

        reference: data.reference || ""
    }
}

export function mapICarToFirebase(data: ICar) {
    return {
        manufacturer: data.manufacturer || "",
        model: data.model || "",
        productionYear: data.productionYear || 1900,
        vin: data.vin || "",
        user: data.user || ""
    }
}
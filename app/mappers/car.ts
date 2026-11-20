import { toDeletedAt } from '~/mappers/softDelete'
import type { ICar } from '~/types/car'

export function mapICar(data: Partial<Omit<ICar, 'deletedAt'>> & { deletedAt?: unknown }): ICar {
  return {
    manufacturer: data.manufacturer || '',
    model: data.model || '',
    productionYear: Number(data.productionYear) || 1900,
    vin: data.vin || '',
    userRef: data.userRef || '',

    deletedAt: toDeletedAt(data.deletedAt),

    reference: data.reference || '',
  }
}

/** Car snapshot embedded in a fix – the owner ref and doc ref are not stored there. */
export function mapICarToFirebase(data: ICar) {
  const { reference: _reference, deletedAt: _deletedAt, ...rest } = mapICar(data)
  return rest
}

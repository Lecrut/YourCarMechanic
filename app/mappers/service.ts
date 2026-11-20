import { SERVICE_CATEGORIES } from '~/domain/service'
import { toDeletedAt } from '~/mappers/softDelete'
import type { IService, ServiceCategory } from '~/types/service'

export function mapIService(data: Partial<Omit<IService, 'deletedAt'>> & { deletedAt?: unknown }): IService {
  const category = SERVICE_CATEGORIES.includes(data.category as ServiceCategory) ? (data.category as ServiceCategory) : 'other'
  return {
    key: data.key || '',
    namePl: data.namePl || data.key || '',
    nameEn: data.nameEn || data.namePl || data.key || '',
    category,
    active: data.active ?? true,
    order: Number(data.order ?? 0),
    deletedAt: toDeletedAt(data.deletedAt),
  }
}

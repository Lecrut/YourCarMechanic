/** A repair type from the moderator-managed `services` collection. */
import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

export interface IService extends ISoftDeletable {
  key: string
  namePl: string
  nameEn: string
  active: boolean
  order: number
}

export function mapIService(data: Partial<Omit<IService, 'deletedAt'>> & { deletedAt?: unknown }): IService {
  return {
    key: data.key || '',
    namePl: data.namePl || data.key || '',
    nameEn: data.nameEn || data.namePl || data.key || '',
    active: data.active ?? true,
    order: Number(data.order ?? 0),
    deletedAt: toDeletedAt(data.deletedAt),
  }
}

/** Initial catalog – used when the collection is empty and for seeding by a moderator. */
export const DEFAULT_SERVICES: IService[] = [
  { key: 'bodyWork', namePl: 'Blacharz', nameEn: 'Body work' },
  { key: 'paint', namePl: 'Lakiernik', nameEn: 'Painter' },
  { key: 'electrician', namePl: 'Elektryk', nameEn: 'Electrician' },
  { key: 'oil', namePl: 'Oleje i filtry', nameEn: 'Oils and filters' },
  { key: 'engine', namePl: 'Silnik', nameEn: 'Engine' },
  { key: 'tires', namePl: 'Opony', nameEn: 'Tires' },
  { key: 'windows', namePl: 'Szyby', nameEn: 'Windows' },
  { key: 'airConditioning', namePl: 'Klimatyzacja', nameEn: 'Air conditioning' },
  { key: 'other', namePl: 'Inne', nameEn: 'Other' },
].map((s, order) => ({ ...s, active: true, order, deletedAt: null }))

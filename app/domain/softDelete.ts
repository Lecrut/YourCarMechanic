import type { ISoftDeletable } from '~/types/softDelete'

export const isDeleted = (item: ISoftDeletable) => item.deletedAt !== null

export const notDeleted = <T extends ISoftDeletable>(items: T[]) => items.filter(i => !isDeleted(i))

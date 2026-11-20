export const toDeletedAt = (value: unknown): Date | null =>
  value ? new Date(value as string | Date) : null

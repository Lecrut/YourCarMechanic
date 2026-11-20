import { DEFAULT_WORKING_DAYS, MAX_STATIONS } from '~/domain/workshop'
import { toDeletedAt } from '~/mappers/softDelete'
import type { IWorkshop } from '~/types/workshop'

export function mapIWorkshop(data: Partial<Omit<IWorkshop, 'contractSignedAt' | 'deletedAt'>> & { contractSignedAt?: Date | string | null, deletedAt?: unknown }): IWorkshop {
  return {
    name: data.name || '',
    nip: data.nip || '',
    openingTime: Number(data.openingTime) || 0,
    closingTime: Number(data.closingTime) || 0,
    city: data.city || '',
    services: [...(data.services ?? [])],
    phone: data.phone || '',
    address: data.address || '',
    ownerUid: data.ownerUid || '',
    status: data.status || 'pending',
    hourlyRate: Number(data.hourlyRate) || 0,
    contractSignedAt: data.contractSignedAt ? new Date(data.contractSignedAt) : null,
    brands: [...(data.brands ?? [])],
    location: data.location && Number.isFinite(Number(data.location.lat)) && Number.isFinite(Number(data.location.lng))
      ? { lat: Number(data.location.lat), lng: Number(data.location.lng) }
      : null,
    stations: Math.min(MAX_STATIONS, Math.max(1, Math.round(Number(data.stations) || 1))),
    workingDays: data.workingDays?.length ? [...new Set(data.workingDays.map(Number))].sort() : [...DEFAULT_WORKING_DAYS],
    deletedAt: toDeletedAt(data.deletedAt),

    reference: data.reference || '',
  }
}

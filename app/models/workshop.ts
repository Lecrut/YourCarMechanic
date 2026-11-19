/**
 * Self-registered companies start `pending` (blocked) until a moderator unlocks them after the contract
 * is signed. Only `approved` companies are visible to customers and can book clients.
 */
import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

export type WorkshopStatus = 'pending' | 'approved' | 'suspended'

export interface IWorkshop extends ISoftDeletable {
  name: string
  nip: string
  openingTime: number
  closingTime: number
  city: string
  services: string[]
  phone: string
  address: string
  ownerUid: string
  status: WorkshopStatus
  /** PLN per labor hour – used by the price list estimates. */
  hourlyRate: number
  /** Set by a moderator when unlocking the company. */
  contractSignedAt: Date | null

  reference: string
}

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
    deletedAt: toDeletedAt(data.deletedAt),

    reference: data.reference || '',
  }
}

import type { ISoftDeletable } from '~/types/softDelete'

/**
 * Self-registered companies start `pending` (blocked) until a moderator unlocks them after the contract
 * is signed. Only `approved` companies are visible to customers and can book clients.
 */
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
  /** Days the workshop is open, `Date#getDay()` numbers (0 = Sunday). */
  workingDays: number[]
  /** Service bays – how many cars can be worked on at the same time. */
  stations: number
  /** Car brands the workshop services; empty = all brands. */
  brands: string[]
  /** Pin on the map set by the workshop; null = not set (city centre is used). */
  location: { lat: number, lng: number } | null

  reference: string
}

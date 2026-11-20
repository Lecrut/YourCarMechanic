import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

/**
 * Self-registered companies start `pending` (blocked) until a moderator unlocks them after the contract
 * is signed. Only `approved` companies are visible to customers and can book clients.
 */
export type WorkshopStatus = 'pending' | 'approved' | 'suspended'

/** Monday–Saturday – also used for companies created before working days existed. */
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5, 6]

export const MAX_STATIONS = 20

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

export const isWorkingDay = (workshop: IWorkshop, day: Date) => workshop.workingDays.includes(day.getDay())

/**
 * Why `date` cannot be booked at `workshop` (an i18n key), or null when it is a valid slot:
 * a full hour, in the future, on a working day, within opening hours.
 */
export function slotProblem(workshop: IWorkshop, date: Date, now = new Date()): string | null {
  if (Number.isNaN(date.getTime())) return 'rules.requiredRule'
  if (date <= now) return 'slots.inPast'
  if (date.getMinutes() !== 0 || date.getSeconds() !== 0) return 'slots.fullHour'
  if (!isWorkingDay(workshop, date)) return 'slots.closedDay'
  if (date.getHours() < workshop.openingTime || date.getHours() >= workshop.closingTime) return 'slots.outsideHours'
  return null
}

/** The next `count` working days starting at `from` (local midnights). Looks at most 8 weeks ahead. */
export function upcomingWorkingDays(workshop: IWorkshop, from: Date, count: number): Date[] {
  const days: Date[] = []
  const day = new Date(from)
  day.setHours(0, 0, 0, 0)
  for (let i = 0; i < 56 && days.length < count; i++) {
    if (isWorkingDay(workshop, day)) days.push(new Date(day))
    day.setDate(day.getDate() + 1)
  }
  return days
}

/**
 * Hourly slots a visit of `durationHours` occupies from `start`: one per started hour,
 * continuing on the next working day at opening time when the workshop closes.
 */
export function occupiedHours(workshop: IWorkshop, start: Date, durationHours: number): Date[] {
  const count = Math.max(1, Math.ceil(durationHours))
  const hours: Date[] = []
  const cursor = new Date(start)
  cursor.setMinutes(0, 0, 0)
  for (let guard = 0; hours.length < count && guard < 24 * 60; guard++) {
    if (isWorkingDay(workshop, cursor) && cursor.getHours() >= workshop.openingTime && cursor.getHours() < workshop.closingTime)
      hours.push(new Date(cursor))
    cursor.setHours(cursor.getHours() + 1)
  }
  return hours
}

/** Whether the workshop services this car brand (no brands listed = all brands). */
export const servicesBrand = (workshop: IWorkshop, brand: string) =>
  !workshop.brands.length || !brand || workshop.brands.some(b => b.toLowerCase() === brand.toLowerCase())

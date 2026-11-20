import type { ICar } from '~/types/car'

/** A customer as seen from their repairs (workshop client list, moderator overview). */
export interface IClient {
  userRef: string
  name: string
  phone: string
  cars: ICar[]
  services: string[]
  visits: number
  lastVisit: Date
  /** Consent from the client's most recent booking wins. */
  marketingConsent: boolean
}

import type { ICar } from '~/types/car'
import type { IFix } from '~/types/fix'

/** One tile of the customer's garage: a car and its repairs. */
export interface IGarageCar {
  key: string
  car: ICar
  /** A car saved in the profile (can be edited, booked directly) vs a one-off car from a booking. */
  saved: boolean
  /** Open repairs, nearest first. */
  active: IFix[]
  /** Closed repairs, newest first. */
  history: IFix[]
}

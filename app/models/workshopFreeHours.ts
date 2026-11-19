export interface IFreeHours {
  /** Day start (local midnight). */
  day: Date
  hours: {
    hour: number
    isBooked: boolean
  }[]
}

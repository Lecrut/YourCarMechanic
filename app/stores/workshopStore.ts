import { pricingService, reviewsService, workshopsService } from '~/services'
import { occupiedHours, servicesBrand, upcomingWorkingDays } from '~/domain/workshop'
import type { IWorkshop } from '~/types/workshop'
import type { IFreeHours } from '~/types/workshopFreeHours'
import { estimateDuration, estimateRepair } from '~/domain/priceList'
import type { IPriceListItem, Range } from '~/types/priceList'
import { bestPromotionFor, discountsAt } from '~/domain/promotion'
import type { IPromotion } from '~/types/promotion'
import { ratingSummary } from '~/domain/review'
import type { IRatingSummary } from '~/types/review'
import { addDays, atHour } from '~/utils/time'
import { createSubscription } from '~/utils/subscription'
import { AppError } from '~/utils/errors'

const DAYS_PER_PAGE = 6

export const useWorkshopStore = defineStore('workshops', () => {
  const workshops = ref<IWorkshop[]>([])
  const freeHoursTable = ref<IFreeHours[]>([])
  const priceLists = ref<Record<string, IPriceListItem[]>>({})
  const promotions = ref<Record<string, IPromotion[]>>({})
  const ratings = ref<Record<string, IRatingSummary>>({})

  /** Per-session caches for one-off reads. */
  const workshopsByRef = new Map<string, IWorkshop>()
  let approved: IWorkshop[] | null = null

  const sharedStore = useSharedStore()
  const slotsSubscription = createSubscription()

  function resetState() {
    slotsSubscription.stop()
    workshops.value = []
    freeHoursTable.value = []
    priceLists.value = {}
    promotions.value = {}
    ratings.value = {}
    workshopsByRef.clear()
    approved = null
  }

  function deleteFindResult() {
    workshops.value = []
    stopWatchingFreeHours()
  }

  const getWorkshopByRef = (companyRef: string) =>
    sharedStore.run(async () => {
      if (!workshopsByRef.has(companyRef)) {
        const workshop = await workshopsService.getWorkshop(companyRef)
        if (!workshop) throw new AppError('errors.notFound')
        workshopsByRef.set(companyRef, workshop)
      }
      return workshopsByRef.get(companyRef)!
    })

  /**
   * Approved workshops offering *all* given services and servicing the car brand, with their
   * price lists and ratings. The map/list does location filtering on the client.
   */
  const getWorkshopsForBooking = (services: string[], brand: string) =>
    sharedStore.run(async () => {
      approved ??= await workshopsService.getApprovedWorkshops()
      workshops.value = approved.filter(w => services.every(s => w.services.includes(s)) && servicesBrand(w, brand))

      const missing = workshops.value.filter(w => !(w.reference in priceLists.value))
      const [lists, promos, reviews] = await Promise.all([
        Promise.all(missing.map(w => pricingService.getPriceList(w.reference))),
        Promise.all(missing.map(w => pricingService.getPromotions(w.reference))),
        missing.length ? reviewsService.getReviewsForWorkshops(missing.map(w => w.reference)) : [],
      ])
      missing.forEach((w, i) => {
        priceLists.value[w.reference] = lists[i] ?? []
        promotions.value[w.reference] = promos[i] ?? []
        ratings.value[w.reference] = ratingSummary(reviews.filter(r => r.companyRef === w.reference))
      })
    })

  /** Price-list estimate for the selected services and car brand (null = no prices); `discounted` applies promotions. */
  function estimateFor(workshop: IWorkshop, services: string[], brand: string, discounted = true): Range | null {
    const discounts = discounted ? discountsAt(promotions.value[workshop.reference] ?? []) : {}
    return estimateRepair(priceLists.value[workshop.reference] ?? [], workshop.hourlyRate, services, brand, discounts)
  }

  /** Best running promotion of a workshop for the selected services (for the badge and the booking snapshot). */
  const promotionFor = (workshop: IWorkshop, services: string[]) =>
    bestPromotionFor(promotions.value[workshop.reference] ?? [], services)

  let watchedDuration = 1

  /**
   * Watches booked slots and rebuilds the availability table for the next `days` working days
   * (from tomorrow). A start hour is free when every hour the visit occupies still has a free bay.
   */
  function watchFreeHours(workshop: IWorkshop, days = DAYS_PER_PAGE, durationHours = watchedDuration) {
    watchedDuration = durationHours
    const workingDays = upcomingWorkingDays(workshop, addDays(new Date(), 1), days)
    if (!workingDays.length) {
      freeHoursTable.value = []
      return
    }
    const from = workingDays[0]!
    // Long visits spill into following days – watch a bit further than the table.
    const to = addDays(workingDays.at(-1)!, 1 + Math.ceil(durationHours / 4) + 7)
    const openHours = Array.from(
      { length: Math.max(0, workshop.closingTime - workshop.openingTime) },
      (_, h) => workshop.openingTime + h,
    )

    sharedStore.loading = true
    slotsSubscription.start(() => workshopsService.watchBookedSlots(
      workshop.reference,
      from,
      to,
      (slots) => {
        const booked = new Map<number, number>()
        for (const d of slots) booked.set(d.getTime(), (booked.get(d.getTime()) ?? 0) + 1)
        const isFree = (start: Date) => occupiedHours(workshop, start, durationHours)
          .every(hour => (booked.get(hour.getTime()) ?? 0) < workshop.stations)

        freeHoursTable.value = workingDays.map(day => ({
          day,
          hours: openHours.map(hour => ({ hour, isBooked: !isFree(atHour(day, hour)) })),
        }))
        sharedStore.loading = false
      },
      e => sharedStore.fail(e),
    ))
  }

  /** Shows three more days in the availability table. */
  function showMoreDays(workshop: IWorkshop) {
    watchFreeHours(workshop, freeHoursTable.value.length + 3)
  }

  /** Expected visit length at a workshop for the selected services (from its price list). */
  const durationFor = (workshop: IWorkshop, services: string[]) =>
    estimateDuration(priceLists.value[workshop.reference] ?? [], services)

  function stopWatchingFreeHours() {
    slotsSubscription.stop()
    freeHoursTable.value = []
  }

  return {
    workshops,
    freeHoursTable,
    ratings,
    resetState,
    deleteFindResult,
    getWorkshopByRef,
    getWorkshopsForBooking,
    estimateFor,
    promotionFor,
    durationFor,
    watchFreeHours,
    showMoreDays,
    stopWatchingFreeHours,
  }
})

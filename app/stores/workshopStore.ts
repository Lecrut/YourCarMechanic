import { pricingService, reviewsService, workshopsService } from '~/services'
import { type IWorkshop, upcomingWorkingDays } from '~/models/workshop'
import type { IFreeHours } from '~/models/workshopFreeHours'
import { estimateRepair, type IPriceListItem, type Range } from '~/models/priceList'
import { bestPromotionFor, discountsAt, type IPromotion } from '~/models/promotion'
import { type IRatingSummary, ratingSummary } from '~/models/review'
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
  const workshopsByCity = new Map<string, IWorkshop[]>()

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
    workshopsByCity.clear()
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

  /** Approved workshops in a city offering *all* given services, with their price lists and ratings. */
  const getWorkshopsByCityAndServices = (city: string, services: string[]) =>
    sharedStore.run(async () => {
      if (!workshopsByCity.has(city))
        workshopsByCity.set(city, await workshopsService.getWorkshopsInCity(city))

      workshops.value = workshopsByCity.get(city)!.filter(w => services.every(s => w.services.includes(s)))

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

  /** Watches booked slots and rebuilds the availability table for the next `days` working days (from tomorrow). */
  function watchFreeHours(workshop: IWorkshop, days = DAYS_PER_PAGE) {
    const workingDays = upcomingWorkingDays(workshop, addDays(new Date(), 1), days)
    if (!workingDays.length) {
      freeHoursTable.value = []
      return
    }
    const from = workingDays[0]!
    const to = addDays(workingDays.at(-1)!, 1)
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
        const booked = new Set(slots.map(d => d.getTime()))
        freeHoursTable.value = workingDays.map(day => ({
          day,
          hours: openHours.map(hour => ({ hour, isBooked: booked.has(atHour(day, hour).getTime()) })),
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
    getWorkshopsByCityAndServices,
    estimateFor,
    promotionFor,
    watchFreeHours,
    showMoreDays,
    stopWatchingFreeHours,
  }
})

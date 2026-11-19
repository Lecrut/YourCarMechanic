import { pricingService } from '~/services'
import { estimateRepair, type IPriceListItem, type Range } from '~/models/priceList'
import { discountsAt, type IPromotion } from '~/models/promotion'

/** The signed-in workshop's own price list. */
export const usePricingStore = defineStore('pricing', () => {
  const items = ref<IPriceListItem[]>([])
  const promotions = ref<IPromotion[]>([])
  const sharedStore = useSharedStore()

  function resetState() {
    items.value = []
    promotions.value = []
  }

  const load = (companyRef: string) =>
    sharedStore.run(async () => {
      const [list, promos] = await Promise.all([
        pricingService.getPriceList(companyRef),
        pricingService.getPromotions(companyRef),
      ])
      items.value = list
      promotions.value = promos
    })

  const save = (companyRef: string, item: IPriceListItem) =>
    sharedStore.run(async () => {
      const saved = await pricingService.savePriceListItem(companyRef, item)
      const exists = items.value.some(i => i.reference === saved.reference)
      items.value = exists
        ? items.value.map(i => (i.reference === saved.reference ? saved : i))
        : [...items.value, saved]
    })

  const remove = (item: IPriceListItem) =>
    sharedStore.run(async () => {
      await pricingService.deletePriceListItem(item.reference)
      items.value = items.value.filter(i => i.reference !== item.reference)
    })

  const savePromotion = (companyRef: string, promotion: IPromotion) =>
    sharedStore.run(async () => {
      const saved = await pricingService.savePromotion(companyRef, promotion)
      const exists = promotions.value.some(p => p.reference === saved.reference)
      promotions.value = exists
        ? promotions.value.map(p => (p.reference === saved.reference ? saved : p))
        : [...promotions.value, saved]
    })

  const removePromotion = (promotion: IPromotion) =>
    sharedStore.run(async () => {
      await pricingService.deletePromotion(promotion.reference)
      promotions.value = promotions.value.filter(p => p.reference !== promotion.reference)
    })

  /** Estimate from the signed-in workshop's own price list, including running promotions. */
  function estimate(services: string[], brand: string): Range | null {
    const company = useAuthStore().company
    return company ? estimateRepair(items.value, company.hourlyRate, services, brand, discountsAt(promotions.value)) : null
  }

  return { items, promotions, load, save, remove, savePromotion, removePromotion, estimate, resetState }
})

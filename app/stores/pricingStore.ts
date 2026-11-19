import { pricingService } from '~/services'
import { estimateRepair, type IPriceListItem, type Range } from '~/models/priceList'

/** The signed-in workshop's own price list. */
export const usePricingStore = defineStore('pricing', () => {
  const items = ref<IPriceListItem[]>([])
  const sharedStore = useSharedStore()

  function resetState() {
    items.value = []
  }

  const load = (companyRef: string) =>
    sharedStore.run(async () => {
      items.value = await pricingService.getPriceList(companyRef)
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

  /** Estimate from the signed-in workshop's own price list. */
  function estimate(services: string[], brand: string): Range | null {
    const company = useAuthStore().company
    return company ? estimateRepair(items.value, company.hourlyRate, services, brand) : null
  }

  return { items, load, save, remove, estimate, resetState }
})

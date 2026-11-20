import { servicesCatalogService } from '~/services'
import { DEFAULT_SERVICES, type IService } from '~/models/service'

/** Repair types managed by moderators (Firestore `services`). Falls back to the defaults until seeded. */
export const useServicesStore = defineStore('services', () => {
  const catalog = ref<IService[]>([])
  const loaded = ref(false)

  // Not `useI18n()` – works also when the store is first used outside a component (middleware).
  const locale = useNuxtApp().$i18n.locale
  const sharedStore = useSharedStore()

  const nameOf = (s: IService) => (locale.value === 'pl' ? s.namePl : s.nameEn)

  const all = computed(() => (catalog.value.length ? catalog.value : DEFAULT_SERVICES))

  /** `{ title, value, category }` items for v-select / checkboxes – active, not deleted services only. */
  const options = computed(() =>
    all.value.filter(s => s.active && !s.deletedAt).map(s => ({ title: nameOf(s), value: s.key, category: s.category })),
  )

  /** Label for any key – including deactivated services still referenced by old fixes. */
  const label = (key: string) => {
    const service = all.value.find(s => s.key === key)
    return service ? nameOf(service) : key
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    try {
      catalog.value = await servicesCatalogService.getServices()
      loaded.value = true
    }
    catch (e) {
      // Catalog is public; a failure here should not block the UI – defaults are used.
      console.error(e)
    }
  }

  const save = (service: IService) =>
    sharedStore.run(async () => {
      const saved = await servicesCatalogService.saveService(service)
      const exists = catalog.value.some(s => s.key === saved.key)
      catalog.value = exists
        ? catalog.value.map(s => (s.key === saved.key ? saved : s))
        : [...catalog.value, saved].sort((a, b) => a.order - b.order)
    })

  const patch = (key: string, changes: Partial<IService>) => {
    catalog.value = catalog.value.map(s => (s.key === key ? { ...s, ...changes } : s))
  }

  /** Soft delete – old repairs keep showing the service name. */
  const remove = (key: string) =>
    sharedStore.run(async () => {
      await servicesCatalogService.deleteService(key)
      patch(key, { deletedAt: new Date() })
    })

  const restore = (key: string) =>
    sharedStore.run(async () => {
      await servicesCatalogService.restoreService(key)
      patch(key, { deletedAt: null })
    })

  const missingDefaults = computed(() =>
    DEFAULT_SERVICES.filter(d => !catalog.value.some(s => s.key === d.key)),
  )

  const seedDefaults = () =>
    sharedStore.run(async () => {
      const toSeed = catalog.value.length ? missingDefaults.value : DEFAULT_SERVICES
      if (!toSeed.length) return
      await servicesCatalogService.seedServices(toSeed)
      catalog.value = [...catalog.value, ...toSeed].sort((a, b) => a.order - b.order)
    })

  return { catalog, all, options, label, missingDefaults, load, save, remove, restore, seedDefaults }
})

import { fixesService } from '~/services'
import { buildClients } from '~/domain/client'
import type { IClient } from '~/types/client'
/** Clients of the signed-in workshop, derived from its repairs. */
export const useClientsStore = defineStore('clients', () => {
  const clients = ref<IClient[]>([])
  const sharedStore = useSharedStore()

  function resetState() {
    clients.value = []
  }

  const load = (companyRef: string) =>
    sharedStore.run(async () => {
      clients.value = buildClients(await fixesService.getAllWorkshopFixes(companyRef))
    })

  return { clients, load, resetState }
})

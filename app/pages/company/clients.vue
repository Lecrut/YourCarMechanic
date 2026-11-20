<script setup lang="ts">
import type { IClient } from '~/types/client'
import PageHeader from '~/components/pageHeader.vue'
import ClientsTable from '~/components/clientsTable.vue'
import BookForClientDialog from '~/components/company/bookForClientDialog.vue'

definePageMeta({ middleware: ['auth'], role: 'workshop' })

const { t } = useI18n()

const authStore = useAuthStore()
const clientsStore = useClientsStore()
const { clients } = storeToRefs(clientsStore)
const { loading, error } = storeToRefs(useSharedStore())

const selected = ref<IClient | null>(null)
const showBooking = ref(false)
const booked = ref(false)

function book(client: IClient) {
  selected.value = client
  showBooking.value = true
}

watch(showBooking, (open, wasOpen) => {
  if (wasOpen && !open && !error.value) booked.value = true
})

onMounted(() => {
  if (authStore.company) clientsStore.load(authStore.company.reference)
})
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('clients.title')"
        :subtitle="t('clients.subtitle')"
        icon="mdi-account-group"
      />

      <v-card
        class="pa-4"
        elevation="2"
      >
        <clients-table
          :clients="clients"
          :loading="loading"
          :can-book="authStore.company?.status === 'approved'"
          @book="book"
        />
      </v-card>
    </v-container>

    <book-for-client-dialog
      v-model="showBooking"
      :client="selected"
    />

    <my-snackbar
      v-model="booked"
      :is-error="false"
      :text="t('clients.bookingSent')"
    />
  </div>
</template>

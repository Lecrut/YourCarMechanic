<script setup lang="ts">
import ServiceList from '~/components/common/serviceList.vue'
import type { IClient } from '~/types/client'
import { formatDateToString } from '~/utils/time'

/** Client list shared by the workshop's "Clients" page and the moderator panel. */
const props = withDefaults(defineProps<{
  clients: IClient[]
  loading?: boolean
  /** Workshop view: filter by marketing consent and allow booking a visit. */
  canBook?: boolean
}>(), { loading: false, canBook: false })

const emit = defineEmits<{ book: [client: IClient] }>()

const { t } = useI18n()
const servicesStore = useServicesStore()

const search = ref('')
const serviceFilter = ref<string[]>([])
const onlyConsent = ref(props.canBook)

const items = computed(() => props.clients.filter(c =>
  (!onlyConsent.value || c.marketingConsent)
  && serviceFilter.value.every(s => c.services.includes(s)),
))

const headers = computed(() => [
  { title: t('clients.name'), key: 'name' },
  { title: t('userProfile.userPhone'), key: 'phone', sortable: false },
  { title: t('moderator.cars'), key: 'cars', sortable: false },
  { title: t('companyProfile.services'), key: 'services', sortable: false },
  { title: t('clients.visits'), key: 'visits' },
  { title: t('clients.lastVisit'), key: 'lastVisit', value: (c: IClient) => c.lastVisit.getTime() },
  { title: t('clients.consent'), key: 'marketingConsent', align: 'center' as const },
  ...(props.canBook ? [{ title: '', key: 'actions', sortable: false, align: 'end' as const }] : []),
])
</script>

<template>
  <v-row class="mb-4">
    <v-col
      cols="12"
      sm="6"
      lg
    >
      <v-text-field
        v-model="search"
        :label="t('moderator.search')"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      lg
    >
      <v-autocomplete
        v-model="serviceFilter"
        v-tooltip:top="t('clients.serviceFilterHint')"
        :items="servicesStore.options"
        :label="t('clients.serviceFilter')"
        prepend-inner-icon="mdi-filter-variant"
        chips
        closable-chips
        multiple
        clearable
        hide-details
        data-testid="clients-service-filter"
      />
    </v-col>
    <!-- Sized to its label: a fixed 2/12 column broke "Tylko ze zgodą" after every few letters. -->
    <v-col
      cols="12"
      lg="auto"
      class="d-flex align-center"
    >
      <v-switch
        v-model="onlyConsent"
        v-tooltip:top="t('clients.consentHint')"
        :label="t('clients.onlyConsent')"
        color="primary"
        hide-details
        data-testid="clients-only-consent"
      />
    </v-col>
  </v-row>

  <v-data-table
    :headers="headers"
    :items="items"
    :search="search"
    :loading="loading"
    :sort-by="[{ key: 'lastVisit', order: 'desc' }]"
    item-value="userRef"
    hover
    data-testid="clients-table"
  >
    <template #[`item.name`]="{ item }">
      {{ item.name || '—' }}
    </template>

    <template #[`item.phone`]="{ item }">
      <v-btn
        v-if="item.phone"
        v-tooltip="t('clients.call')"
        :href="`tel:${item.phone}`"
        variant="text"
        size="small"
        prepend-icon="mdi-phone"
      >
        {{ item.phone }}
      </v-btn>
    </template>

    <template #[`item.cars`]="{ item }">
      <div
        v-for="car in item.cars"
        :key="`${car.manufacturer}${car.model}${car.productionYear}`"
      >
        {{ car.manufacturer }} {{ car.model }} ({{ car.productionYear }})
      </div>
    </template>

    <template #[`item.services`]="{ item }">
      <service-list :services="item.services" />
    </template>

    <template #[`item.lastVisit`]="{ item }">
      {{ formatDateToString(item.lastVisit) }}
    </template>

    <template #[`item.marketingConsent`]="{ item }">
      <v-icon
        v-tooltip="item.marketingConsent ? t('clients.consentYes') : t('clients.consentNo')"
        :icon="item.marketingConsent ? 'mdi-check-circle' : 'mdi-minus-circle-outline'"
        :color="item.marketingConsent ? 'success' : 'medium-emphasis'"
      />
    </template>

    <template #[`item.actions`]="{ item }">
      <v-btn
        v-tooltip="t('clients.bookForClient')"
        icon="mdi-calendar-plus"
        variant="text"
        color="primary"
        size="small"
        :aria-label="t('clients.bookForClient')"
        data-testid="book-client"
        @click="emit('book', item)"
      />
    </template>

    <template #no-data>
      <v-empty-state
        icon="mdi-account-off-outline"
        :title="t('clients.empty')"
      />
    </template>
  </v-data-table>
</template>

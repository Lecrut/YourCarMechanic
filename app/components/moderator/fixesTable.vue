<script setup lang="ts">
import ServiceList from '~/components/common/serviceList.vue'
import { statusColor } from '~/domain/fix'
import type { IFix } from '~/types/fix'
import { notificationLabel } from '~/utils/options'
import { formatDateToString } from '~/utils/time'
import RepairDetails from '~/components/fix/repairDetails.vue'

const { t } = useI18n()

const moderatorStore = useModeratorStore()
const { fixes, users } = storeToRefs(moderatorStore)
const servicesStore = useServicesStore()
const { loading } = storeToRefs(useSharedStore())

const search = ref('')
const onlyActive = ref(true)
const serviceFilter = ref<string | null>(null)
const dateFrom = ref('')
const dateTo = ref('')
const selectedRef = ref<string | null>(null)
const selected = computed(() => fixes.value.find(f => f.reference === selectedRef.value) ?? null)
const showDetails = ref(false)

function lastStatus(fix: IFix) {
  const last = fix.notifications.at(-1)
  return last ? notificationLabel(t, last.notificationType) : t('moderator.statusNew')
}

function clientInfo(fix: IFix) {
  const user = users.value.find(u => u.reference === fix.userRef)
  const fullName = user?.profile ? `${user.profile.name} ${user.profile.surname}`.trim() : ''
  return {
    name: fix.clientName || fullName || user?.email || '—',
    phone: fix.clientPhone || user?.profile?.phone || '',
    email: user?.email || '',
  }
}

function matchesQuery(fix: IFix, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const client = clientInfo(fix)
  const haystack = [
    formatDateToString(fix.date),
    moderatorStore.workshopName(fix.companyRef),
    client.name,
    client.phone,
    client.email,
    fix.car.manufacturer,
    fix.car.model,
    fix.car.vin,
    fix.description,
    lastStatus(fix),
    ...fix.services.map(key => servicesStore.label(key)),
  ].join(' ').toLowerCase()
  return haystack.includes(q)
}

const items = computed(() => {
  const fromMs = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`).getTime() : null
  const toMs = dateTo.value ? new Date(`${dateTo.value}T23:59:59.999`).getTime() : null
  return fixes.value.filter((f) => {
    if (onlyActive.value && f.isClosed) return false
    if (serviceFilter.value && !f.services.includes(serviceFilter.value)) return false
    const time = f.date.getTime()
    if (fromMs !== null && time < fromMs) return false
    if (toMs !== null && time > toMs) return false
    return matchesQuery(f, search.value)
  })
})

const headers = computed(() => [
  { title: t('moderator.date'), key: 'date', value: (f: IFix) => f.date.getTime() },
  { title: t('userBookFix.stepper.fourth.workshop'), key: 'company', value: (f: IFix) => moderatorStore.workshopName(f.companyRef) },
  { title: t('moderator.client'), key: 'client', value: (f: IFix) => clientInfo(f).name },
  { title: t('userBookFix.stepper.fourth.car'), key: 'car', value: (f: IFix) => `${f.car.manufacturer} ${f.car.model}` },
  { title: t('companyProfile.services'), key: 'services', sortable: false },
  { title: t('fixStatues.title'), key: 'status', sortable: false },
])

function open(_: unknown, row: { item: IFix }) {
  selectedRef.value = row.item.reference
  showDetails.value = true
}
</script>

<template>
  <v-row class="mb-4 align-center">
    <v-col
      cols="12"
      md="4"
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
      md="3"
    >
      <v-autocomplete
        v-model="serviceFilter"
        :items="servicesStore.options"
        :label="t('companyProfile.services')"
        prepend-inner-icon="mdi-tools"
        clearable
        hide-details
        data-testid="fixes-service-filter"
      />
    </v-col>
    <v-col
      cols="6"
      md="2"
    >
      <v-text-field
        v-model="dateFrom"
        type="date"
        :label="t('moderator.dateFrom')"
        clearable
        hide-details
        data-testid="fixes-date-from"
      />
    </v-col>
    <v-col
      cols="6"
      md="2"
    >
      <v-text-field
        v-model="dateTo"
        type="date"
        :label="t('moderator.dateTo')"
        clearable
        hide-details
        data-testid="fixes-date-to"
      />
    </v-col>
    <v-col
      cols="12"
      md="1"
      class="d-flex justify-md-end"
    >
      <v-switch
        v-model="onlyActive"
        color="primary"
        hide-details
        :label="t('company.activeFixes')"
      />
    </v-col>
  </v-row>

  <v-data-table
    :headers="headers"
    :items="items"
    :loading="loading"
    :sort-by="[{ key: 'date', order: 'desc' }]"
    item-value="reference"
    hover
    data-testid="fixes-table"
    @click:row="open"
  >
    <template #[`item.date`]="{ item }">
      {{ formatDateToString(item.date) }}
    </template>

    <template #[`item.client`]="{ item }">
      <div>{{ clientInfo(item).name }}</div>
      <div
        v-if="clientInfo(item).phone"
        class="text-caption text-medium-emphasis"
      >
        {{ clientInfo(item).phone }}
      </div>
    </template>

    <template #[`item.car`]="{ item }">
      <div>{{ item.car.manufacturer }} {{ item.car.model }}</div>
      <div
        v-if="item.car.vin"
        class="text-caption text-medium-emphasis"
      >
        {{ item.car.vin }}
      </div>
    </template>

    <template #[`item.services`]="{ item }">
      <service-list :services="item.services" />
    </template>

    <template #[`item.status`]="{ item }">
      <v-chip
        :color="statusColor(item)"
        size="small"
        variant="flat"
      >
        {{ lastStatus(item) }}
      </v-chip>
    </template>
  </v-data-table>

  <repair-details
    v-if="selected"
    v-model="showDetails"
    :fix="selected"
    mode="moderator"
  />
</template>

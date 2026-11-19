<script setup lang="ts">
import { type IFix, statusColor } from '~/models/fix'
import { notificationLabel } from '~/composables/notifications'
import { formatDateToString } from '~/utils/time'
import RepairDetails from '~/components/fix/repairDetails.vue'

const { t } = useI18n()

const moderatorStore = useModeratorStore()
const { fixes } = storeToRefs(moderatorStore)
const servicesStore = useServicesStore()
const { loading } = storeToRefs(useSharedStore())

const search = ref('')
const onlyActive = ref(false)
const selected = ref<IFix | null>(null)
const showDetails = ref(false)

const items = computed(() => (onlyActive.value ? fixes.value.filter(f => !f.isClosed) : fixes.value))

const headers = computed(() => [
  { title: t('moderator.date'), key: 'date', value: (f: IFix) => f.date.getTime() },
  { title: t('userBookFix.stepper.fourth.workshop'), key: 'company', value: (f: IFix) => moderatorStore.workshopName(f.companyRef) },
  { title: t('moderator.client'), key: 'client', value: (f: IFix) => moderatorStore.userEmail(f.userRef) },
  { title: t('userBookFix.stepper.fourth.car'), key: 'car', value: (f: IFix) => `${f.car.manufacturer} ${f.car.model}` },
  { title: t('companyProfile.services'), key: 'services', sortable: false },
  { title: t('fixStatues.title'), key: 'status', sortable: false },
])

function lastStatus(fix: IFix) {
  const last = fix.notifications.at(-1)
  return last ? notificationLabel(t, last.notificationType) : t('moderator.statusNew')
}

function open(_: unknown, row: { item: IFix }) {
  selected.value = row.item
  showDetails.value = true
}
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-4 mb-4">
    <v-text-field
      v-model="search"
      :label="t('moderator.search')"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
    />
    <v-switch
      v-model="onlyActive"
      color="primary"
      hide-details
      :label="t('company.activeFixes')"
    />
  </div>

  <v-data-table
    :headers="headers"
    :items="items"
    :search="search"
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

    <template #[`item.services`]="{ item }">
      <v-chip
        v-for="key in item.services"
        :key="key"
        size="small"
        variant="tonal"
        class="ma-1"
      >
        {{ servicesStore.label(key) }}
      </v-chip>
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

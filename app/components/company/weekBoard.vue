<script setup lang="ts">
import { type IFix, lastStatus, statusColor } from '~/models/fix'
import type { IWorkshop } from '~/models/workshop'
import { buildWeek, carsAtWorkshop } from '~/models/week'
import { notificationLabel } from '~/composables/notifications'
import { addDays, formatDateToString } from '~/utils/time'
import { formatDuration } from '~/models/priceList'
import RepairDetails from '~/components/fix/repairDetails.vue'

/** Google-Calendar-like board: next 7 days × opening hours, plus cars currently at the workshop. */
const props = defineProps<{
  fixes: IFix[]
  workshop: IWorkshop
}>()

const { t, locale } = useI18n()
const servicesStore = useServicesStore()

const offset = ref(0)
/** Kept as a reference so the open dialog follows live updates. */
const selectedRef = ref<string | null>(null)
const showDetails = ref(false)

const from = computed(() => addDays(new Date(), offset.value * 7))
const week = computed(() => buildWeek(props.fixes, props.workshop, from.value))
const selected = computed(() => props.fixes.find(f => f.reference === selectedRef.value) ?? null)
const atWorkshop = computed(() => carsAtWorkshop(props.fixes))
const visitsInWeek = computed(() => week.value.days.reduce((sum, d) => sum + d.cells.flat().filter(e => !e.continued).length, 0))

const dateLocale = computed(() => (locale.value === 'pl' ? 'pl-PL' : 'en-GB'))
const weekday = (d: Date) => d.toLocaleDateString(dateLocale.value, { weekday: 'short' })
const rangeLabel = computed(() => {
  const days = week.value.days
  const fmt = (d: Date) => d.toLocaleDateString(dateLocale.value, { day: 'numeric', month: 'short' })
  return `${fmt(days[0]!.day)} – ${fmt(days.at(-1)!.day)}`
})

const statusOf = (fix: IFix) => {
  const last = lastStatus(fix)
  return last ? notificationLabel(t, last.notificationType) : t('moderator.statusNew')
}

function open(fix: IFix) {
  selectedRef.value = fix.reference
  showDetails.value = true
}
</script>

<template>
  <v-row>
    <v-col
      cols="12"
      lg="9"
    >
      <v-card
        variant="outlined"
        data-testid="week-board"
      >
        <v-toolbar
          density="comfortable"
          color="transparent"
        >
          <v-btn
            v-tooltip:bottom="t('board.previous')"
            icon="mdi-chevron-left"
            :aria-label="t('board.previous')"
            data-testid="week-prev"
            @click="offset--"
          />
          <v-btn
            variant="tonal"
            size="small"
            :disabled="offset === 0"
            data-testid="week-today"
            @click="offset = 0"
          >
            {{ t('company.today') }}
          </v-btn>
          <v-btn
            v-tooltip:bottom="t('board.next')"
            icon="mdi-chevron-right"
            :aria-label="t('board.next')"
            data-testid="week-next"
            @click="offset++"
          />
          <v-toolbar-title class="text-title-large">
            {{ rangeLabel }}
          </v-toolbar-title>
          <v-chip
            class="mr-4"
            size="small"
            variant="tonal"
            prepend-icon="mdi-calendar-check"
          >
            {{ t('board.visits', { count: visitsInWeek }) }}
          </v-chip>
        </v-toolbar>

        <v-divider />

        <v-table
          density="compact"
          fixed-header
          height="640"
          hover
        >
          <thead>
            <tr>
              <th class="text-center" />
              <th
                v-for="day in week.days"
                :key="day.day.getTime()"
                class="text-center py-2"
                :class="{ 'text-disabled': !day.isWorking }"
              >
                <div class="text-label-medium text-uppercase">
                  {{ weekday(day.day) }}
                </div>
                <v-avatar
                  :color="day.isToday ? 'primary' : undefined"
                  size="36"
                  class="text-title-medium"
                >
                  {{ day.day.getDate() }}
                </v-avatar>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(hour, row) in week.hours"
              :key="hour"
            >
              <td class="text-body-small text-medium-emphasis text-no-wrap align-top pt-1">
                {{ hour }}:00
              </td>
              <td
                v-for="day in week.days"
                :key="day.day.getTime()"
                class="align-top pa-1"
                :class="{ 'bg-surface-light': !day.isWorking }"
              >
                <v-card
                  v-for="{ fix, continued } in day.cells[row]"
                  :key="fix.reference"
                  v-tooltip:top="`${statusOf(fix)} · ${fix.services.map(servicesStore.label).join(', ')} · ${formatDuration(fix.durationHours)}`"
                  :color="statusColor(fix)"
                  :variant="continued ? 'outlined' : 'tonal'"
                  density="compact"
                  class="mb-1 pa-1"
                  rounded="lg"
                  hover
                  data-testid="board-visit"
                  @click="open(fix)"
                >
                  <div class="text-label-medium font-weight-bold text-truncate">
                    <span v-if="continued">{{ t('board.continued') }} </span>{{ fix.car.manufacturer }} {{ fix.car.model }}
                  </div>
                  <div class="text-label-small text-truncate">
                    {{ fix.clientName || fix.clientPhone }}
                  </div>
                </v-card>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-col>

    <v-col
      cols="12"
      lg="3"
    >
      <v-card
        variant="outlined"
        class="h-100"
        data-testid="at-workshop"
      >
        <v-card-item prepend-icon="mdi-garage-open-variant">
          <template #title>
            <span class="text-wrap">{{ t('board.atWorkshop') }}</span>
          </template>
          <template #subtitle>
            <span class="text-wrap">{{ t('board.atWorkshopHint') }}</span>
          </template>
          <template #append>
            <v-chip
              size="small"
              color="primary"
              variant="flat"
            >
              {{ atWorkshop.length }}
            </v-chip>
          </template>
        </v-card-item>
        <v-divider />
        <v-list
          v-if="atWorkshop.length"
          lines="two"
          density="compact"
          nav
        >
          <v-list-item
            v-for="fix in atWorkshop"
            :key="fix.reference"
            :title="`${fix.car.manufacturer} ${fix.car.model}`"
            :subtitle="`${statusOf(fix)} · ${formatDateToString(fix.date)}`"
            rounded="lg"
            @click="open(fix)"
          >
            <template #prepend>
              <v-avatar
                :color="statusColor(fix)"
                size="10"
                class="mr-3"
              />
            </template>
          </v-list-item>
        </v-list>
        <v-empty-state
          v-else
          icon="mdi-garage-variant"
          :title="t('board.emptyWorkshop')"
          size="64"
        />
      </v-card>
    </v-col>
  </v-row>

  <repair-details
    v-if="selected"
    v-model="showDetails"
    :fix="selected"
    mode="workshop"
  />
</template>

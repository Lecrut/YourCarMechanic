<script setup lang="ts">
import { computeStats, type IWorkshopStats } from '~/models/stats'

const { t, locale } = useI18n()

const moderatorStore = useModeratorStore()
const { fixes } = storeToRefs(moderatorStore)
const reviewsStore = useReviewsStore()
const servicesStore = useServicesStore()

const stats = computed(() => computeStats(fixes.value, reviewsStore.all))

/** Hours under two days are shown in hours, longer in days. */
function duration(hours: number | null) {
  if (hours === null) return t('stats.noData')
  return hours < 48
    ? t('stats.hours', { value: Math.round(hours * 10) / 10 })
    : t('stats.days', { value: Math.round((hours / 24) * 10) / 10 })
}

const money = (value: number) => `${value.toLocaleString(locale.value === 'pl' ? 'pl-PL' : 'en-GB')} PLN`

const kpis = computed(() => [
  { icon: 'mdi-car-wrench', color: 'primary', value: String(stats.value.total), label: t('stats.total') },
  { icon: 'mdi-progress-wrench', color: 'info', value: String(stats.value.byOutcome.inProgress), label: t('stats.inProgress') },
  { icon: 'mdi-check-circle-outline', color: 'success', value: String(stats.value.byOutcome.finished), label: t('stats.finished') },
  { icon: 'mdi-timer-outline', color: 'secondary', value: duration(stats.value.avgRepairHours), label: t('stats.avgRepairTime'), hint: t('stats.avgRepairTimeHint') },
  { icon: 'mdi-calendar-clock', color: 'warning', value: duration(stats.value.avgWaitHours), label: t('stats.avgWaitTime'), hint: t('stats.avgWaitTimeHint') },
  { icon: 'mdi-cash-multiple', color: 'amber', value: money(stats.value.quotesTotal), label: t('stats.quotesTotal'), hint: t('stats.quotesTotalHint') },
])

const outcomes = computed(() => {
  const total = stats.value.total || 1
  return [
    { label: t('stats.inProgress'), color: 'info', count: stats.value.byOutcome.inProgress },
    { label: t('stats.finished'), color: 'success', count: stats.value.byOutcome.finished },
    { label: t('stats.cancelled'), color: 'error', count: stats.value.byOutcome.cancelled },
  ].map(o => ({ ...o, percent: Math.round((o.count / total) * 100) }))
})

const monthLabels = computed(() => stats.value.perMonth.map(p =>
  p.month.toLocaleDateString(locale.value === 'pl' ? 'pl-PL' : 'en-GB', { month: 'short' })))

const topServiceMax = computed(() => Math.max(1, ...stats.value.topServices.map(s => s.count)))

const workshopHeaders = computed(() => [
  { title: t('userBookFix.stepper.fourth.workshop'), key: 'companyRef', value: (w: IWorkshopStats) => moderatorStore.workshopName(w.companyRef) },
  { title: t('stats.repairs'), key: 'repairs' },
  { title: t('stats.finished'), key: 'finished' },
  { title: t('stats.avgRepairTime'), key: 'avgRepairHours', value: (w: IWorkshopStats) => w.avgRepairHours ?? -1 },
  { title: t('stats.avgRating'), key: 'avgRating', value: (w: IWorkshopStats) => w.avgRating ?? 0 },
  { title: t('stats.quotesTotal'), key: 'quotesTotal' },
])
</script>

<template>
  <v-row>
    <v-col
      v-for="kpi in kpis"
      :key="kpi.label"
      cols="12"
      sm="6"
      lg="4"
    >
      <v-card
        v-tooltip:top="kpi.hint"
        variant="tonal"
        :color="kpi.color"
        hover
      >
        <v-card-item>
          <template #prepend>
            <v-avatar
              :color="kpi.color"
              size="48"
            >
              <v-icon :icon="kpi.icon" />
            </v-avatar>
          </template>
          <v-card-title class="text-headline-small font-weight-bold">
            {{ kpi.value }}
          </v-card-title>
          <v-card-subtitle>{{ kpi.label }}</v-card-subtitle>
        </v-card-item>
      </v-card>
    </v-col>

    <v-col
      cols="12"
      lg="8"
    >
      <v-card
        variant="outlined"
        class="h-100"
      >
        <v-card-item
          :title="t('stats.perMonth')"
          prepend-icon="mdi-chart-line"
        />
        <v-card-text>
          <v-sparkline
            :model-value="stats.perMonth.map(p => p.count)"
            :labels="monthLabels"
            color="primary"
            line-width="2"
            padding="12"
            label-size="5"
            smooth
            auto-draw
            fill
            gradient-direction="top"
            :gradient="['rgba(77,141,255,0.6)', 'rgba(77,141,255,0.05)']"
            data-testid="stats-sparkline"
          />
        </v-card-text>
      </v-card>
    </v-col>

    <v-col
      cols="12"
      lg="4"
    >
      <v-card
        variant="outlined"
        class="h-100"
      >
        <v-card-item
          :title="t('stats.byStatus')"
          prepend-icon="mdi-chart-donut"
        >
          <template #append>
            <v-chip
              v-tooltip:top="t('stats.cancelRate')"
              size="small"
              color="error"
              variant="tonal"
            >
              {{ stats.cancelRate }}%
            </v-chip>
          </template>
        </v-card-item>
        <v-card-text>
          <div
            v-for="o in outcomes"
            :key="o.label"
            class="mb-4"
          >
            <div class="d-flex justify-space-between text-body-medium mb-1">
              <span>{{ o.label }}</span>
              <span class="font-weight-bold">{{ o.count }} · {{ o.percent }}%</span>
            </div>
            <v-progress-linear
              :model-value="o.percent"
              :color="o.color"
              height="10"
              rounded
            />
          </div>

          <v-divider class="my-4" />

          <div class="text-title-small mb-3">
            {{ t('stats.topServices') }}
          </div>
          <div
            v-for="s in stats.topServices"
            :key="s.key"
            class="mb-3"
          >
            <div class="d-flex justify-space-between text-body-small mb-1">
              <span>{{ servicesStore.label(s.key) }}</span>
              <span>{{ s.count }}</span>
            </div>
            <v-progress-linear
              :model-value="(s.count / topServiceMax) * 100"
              color="secondary"
              height="6"
              rounded
            />
          </div>
          <p
            v-if="!stats.topServices.length"
            class="text-medium-emphasis"
          >
            {{ t('stats.noData') }}
          </p>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-card variant="outlined">
        <v-card-item
          :title="t('stats.workshops')"
          prepend-icon="mdi-podium"
        />
        <v-data-table
          :headers="workshopHeaders"
          :items="stats.workshops"
          item-value="companyRef"
          density="comfortable"
          hover
          data-testid="stats-workshops"
        >
          <template #[`item.avgRepairHours`]="{ item }">
            {{ duration(item.avgRepairHours) }}
          </template>
          <template #[`item.avgRating`]="{ item }">
            <div
              v-if="item.avgRating"
              class="d-flex align-center ga-1"
            >
              <v-icon
                icon="mdi-star"
                color="amber"
                size="small"
              />
              {{ item.avgRating }}
            </div>
            <span v-else>—</span>
          </template>
          <template #[`item.quotesTotal`]="{ item }">
            {{ money(item.quotesTotal) }}
          </template>
        </v-data-table>
      </v-card>
    </v-col>
  </v-row>
</template>

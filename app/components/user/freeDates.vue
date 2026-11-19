<script setup lang="ts">
import type { IWorkshop } from '~/models/workshop'
import { atHour, formatDayLabel } from '~/utils/time'

const isDialogShown = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  workshop: IWorkshop
  /** Visit length in hours – decides how many consecutive free bays a start time needs. */
  durationHours?: number
}>(), { durationHours: 1 })

const emit = defineEmits<{
  select: [date: Date]
}>()

const { t, locale } = useI18n()

const workshopStore = useWorkshopStore()
const { freeHoursTable } = storeToRefs(workshopStore)

const sharedStore = useSharedStore()
const { loading } = storeToRefs(sharedStore)

function close() {
  isDialogShown.value = false
  workshopStore.stopWatchingFreeHours()
}

function selectDate(day: Date, hour: number) {
  emit('select', atHour(day, hour))
  close()
}

// Slots are watched live while the dialog is open, so hours booked by others disappear immediately.
watch(isDialogShown, (shown) => {
  if (shown) workshopStore.watchFreeHours(props.workshop, undefined, props.durationHours)
  else workshopStore.stopWatchingFreeHours()
})

onUnmounted(() => workshopStore.stopWatchingFreeHours())
</script>

<template>
  <v-dialog
    max-width="1100px"
    :model-value="isDialogShown"
    scrollable
    @update:model-value="close"
  >
    <v-card>
      <v-card-title>
        {{ workshop.name }}
      </v-card-title>

      <v-card-text>
        <div
          v-for="day in freeHoursTable"
          :key="day.day.getTime()"
          class="mb-3"
        >
          <div class="font-weight-bold mt-2 ml-2">
            {{ formatDayLabel(day.day, locale) }}
          </div>
          <v-divider />

          <div
            v-if="day.hours.every(slot => slot.isBooked)"
            class="my-1 text-center"
          >
            <v-chip
              color="error"
              class="my-1"
            >
              <v-icon
                icon="mdi-alert-outline"
                start
              />
              {{ t('userBookFix.stepper.third.noAvailableDates') }}
            </v-chip>
          </div>

          <v-chip-group column>
            <v-chip
              v-for="slot in day.hours"
              :key="slot.hour"
              :disabled="slot.isBooked"
              class="ma-1"
              data-testid="free-hour"
              @click="selectDate(day.day, slot.hour)"
            >
              {{ slot.hour }}:00
            </v-chip>
          </v-chip-group>
        </div>

        <div class="mt-5 text-center">
          <v-progress-circular
            v-if="loading"
            :size="50"
            color="primary"
            indeterminate
          />
          <v-btn
            v-else
            icon="mdi-arrow-down-thin"
            data-testid="more-days"
            @click="workshopStore.showMoreDays(workshop)"
          />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="default"
          @click="close"
        >
          {{ t('universal.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

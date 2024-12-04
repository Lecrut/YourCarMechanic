<script setup lang="ts">
import type {IWorkshop} from "~/models/workshop";
import {upperFirst} from "scule";
import {storeToRefs} from "pinia";

const isDialogShown = defineModel<boolean>()

const {t} = useI18n()

const props = defineProps<{
  workshop: IWorkshop
  bookFix(workshop: IWorkshop, date: Date): void
}>()
const {workshop} = toRefs(props)

const workshopStore = useWorkshopStore()
const {freeHoursTable} = storeToRefs(workshopStore)

const sharedStore = useSharedStore()
const {loading} = storeToRefs(sharedStore)

function close() {
  isDialogShown.value = false
}

function convertToFutureDate(day: string, hour: string): Date {
  const [dayOfWeek, dayMonth] = day.split(', ');
  const [dayNum, month] = dayMonth.split('.').map(Number);

  const hourNum = parseInt(hour, 10);

  const currentYear = new Date().getFullYear();

  let date = new Date(currentYear, month - 1, dayNum, hourNum, 0, 0);

  if (date < new Date()) {
    date.setFullYear(currentYear + 1);
  }

  return date;
}

function selectDate(day: string, hour: string) {
  props.bookFix(workshop.value, convertToFutureDate(day, hour))
  close()
}

async function addDays() {
  await workshopStore.getNextFreeDays(workshop.value)
}

watch(isDialogShown, async () => {
  if (isDialogShown.value)
    await workshopStore.getWorkshopFreeHours(workshop.value)
})
</script>

<template>
  <v-dialog
      max-width="1100px"
      :model-value="isDialogShown"
      scrollable
      @update:model-value="close">
    <v-card>
      <v-card-title>
        {{ workshop.name }}
      </v-card-title>

      <v-card-text>
        <v-row
            v-for="(day) in freeHoursTable"
        >
          <div class="font-weight-bold mt-2 ml-2">
            {{ upperFirst(day.day) }}
          </div>
          <v-divider/>

          <v-chip-group column>
            <v-chip
                v-for="(hour) in day.hours"
                :disabled="hour.isBooked"
                class="ma-1"
                @click="selectDate(day.day, hour.hour)"
            >
              {{ hour.hour }}:00
            </v-chip>
          </v-chip-group>
        </v-row>

        <div align="center" class="mt-5">
          <v-btn
              v-if="!loading"
              icon="mdi-arrow-down-thin"
              @click="addDays"
          />

          <v-progress-circular
              v-else
              :size="50"
              color="primary"
              indeterminate
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

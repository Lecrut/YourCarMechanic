<script setup lang="ts">
import type {IWorkshop} from "~/models/workshop";
import {upperFirst} from "scule";
import {storeToRefs} from "pinia";
import {convertToFutureDate} from "~/helpers/time";

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

          <div align="center" class="my-1">
            <v-chip
                v-if="!day.hours.length || day.hours.every(appointment => appointment.isBooked)"
                color="error"
                class="my-1"
            >
              <v-icon icon="mdi-alert-outline" start></v-icon>

              {{ t('userBookFix.stepper.third.noAvailableDates') }}
            </v-chip>
          </div>


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

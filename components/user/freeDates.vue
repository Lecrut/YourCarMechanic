<script setup lang="ts">
import type {IWorkshop} from "~/models/workshop";

const isDialogShown = defineModel<boolean>()

const {t} = useI18n()

const props = defineProps<{ workshop: IWorkshop }>()
const {workshop} = toRefs(props)

const workshopStore = useWorkshopStore()
const {freeHoursTable} = storeToRefs(workshopStore)

function close() {
  isDialogShown.value = false
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
            {{ day.day }}
          </div>
          <v-divider/>

          <v-chip-group column>
            <v-chip
                v-for="(hour) in day.hours"
                :disabled="hour.isBooked"
                class="ma-1"
                @click="console.log(hour.hour, day.day)"
            >
              {{ hour.hour }}:00
            </v-chip>
          </v-chip-group>
        </v-row>

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

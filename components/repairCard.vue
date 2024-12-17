<script setup lang="ts">
import type {IFix} from "~/models/fix";
import {services} from "~/composable/services";
import RepairDetails from "~/components/user/repairDetails.vue";
import {formatDateToString} from "~/helpers/time";

const props = defineProps<{
  fix: IFix,
  isCompany: boolean
}>()

const {fix} = toRefs(props)

const {t} = useI18n()

const fixStatus = computed(() => {
  const howManyNotifications = fix.value.notifications.length
  const isEnded = fix.value.notifications.some(x => x.notificationType === 'giveBackCar')
  return isEnded ? 100 : howManyNotifications > 1 ? 60 : howManyNotifications === 0 ? 10 : 30
})

const showDialog = ref(false)
</script>

<template>
  <v-card
      variant="tonal"
      elevation="10"
  >
    <v-card-title align="center">
      <div class="mt-2">
        <v-icon
            icon="mdi-car"
            color="primary"
            class="mx-2 mb-2"
        ></v-icon>
        {{ fix.car.manufacturer }} {{ fix.car.model }} - {{ fix.car.productionYear }}
      </div>
    </v-card-title>

    <v-card-text>
      <div class="mb-1">
        <v-chip-group column>
          <v-chip
              v-for="(item) in fix.services"
              density="comfortable"
              class="mr-1 my-2"
          >
            {{ services(t).find(x => x.value === item)?.title || '' }}
          </v-chip>
        </v-chip-group>
      </div>

      <div class="mb-2" align="center">
        <v-icon
            icon="mdi-calendar-blank"
            color="primary"
            class="mx-2 mb-2"
        ></v-icon>
        {{ formatDateToString(fix.date) }}
      </div>

      <div align="center" class="mb-2">
        <v-btn
            @click="showDialog=true"
            size="small"
        >
          {{ t('notifications.openDetails') }}
        </v-btn>
      </div>

    </v-card-text>
    <v-progress-linear v-model="fixStatus" color="primary"/>
  </v-card>

  <repair-details
      v-model="showDialog"
      :fix="fix"
      :is-company="isCompany"
  />

</template>
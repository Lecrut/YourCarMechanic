<script setup lang="ts">
import type {IFix} from "~/models/fix";
import {services} from "~/composable/services";
import RepairDetails from "~/components/user/repairDetails.vue";
import {formatDateToString} from "~/helpers/time";
import {mapINotification} from "~/models/notification";

const props = defineProps<{
  fix: IFix,
  isCompany: boolean
}>()

const {fix} = toRefs(props)

const {t} = useI18n()

const fixesStore = useFixesStore()

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const fixStatus = computed(() => {
  const howManyNotifications = fix.value.notifications.length
  const isEnded = fix.value.notifications.some(x => x.notificationType === 'giveBackCar')
  const isCanceled = fix.value.notifications.some(x => x.notificationType === 'workshopCancel' || x.notificationType === 'userCancel')
  return isEnded ? 100 : isCanceled ? 0 : howManyNotifications > 1 ? 60 : howManyNotifications === 0 ? 10 : 30
})

const canBeCanceled = computed(() => {
  const fixDate = new Date(fix.value.date)
  const currentDate = new Date()

  return Boolean(user.value?.role === "user" ? currentDate < fixDate : fixDate < currentDate) && !fix.value.notifications.length
})

const showDialog = ref(false)

async function cancelRepair() {
  await fixesStore.addNotification(
      fix.value,
      mapINotification(
          {
            sendDate: new Date(),
            notificationType: user.value?.role === "user" ? "userCancel" : "workshopCancel",
            cost: null,
            description: "",
            date: new Date()
          }
      )
  )
}
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
            class="mx-1"
        >
          {{ t('notifications.openDetails') }}
        </v-btn>

        <v-btn
            v-if="fixStatus !== 100"
            @click="cancelRepair"
            size="small"
            class="mx-1"
            :disabled="!canBeCanceled"
        >
          {{ t('notifications.cancel') }}
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
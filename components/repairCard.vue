<script setup lang="ts">
import type {IFix} from "~/models/fix";
import {services} from "~/composable/services";
import RepairDetails from "~/components/user/repairDetails.vue";

const props = defineProps<{
  fix: IFix,
  isCompany: boolean
}>()

const {fix} = toRefs(props)

const {t} = useI18n()

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

      <!--todo: show fix date-->

      <div align="center" class="mb-2">
        <v-btn
            @click="showDialog=true"
            size="small"
        >
          {{ t('notifications.openDetails') }}
        </v-btn>
      </div>

    </v-card-text>
  </v-card>

  <repair-details
      v-model="showDialog"
      :fix="fix"
      :is-company="isCompany"
  />

</template>
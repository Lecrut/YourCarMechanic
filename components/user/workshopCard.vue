<script setup lang="ts">
import type {IWorkshop} from "~/models/workshop";
import {services} from "~/composable/services";
import FreeDates from "~/components/user/freeDates.vue";

const props = defineProps<{
  workshop: IWorkshop
  isPresentation: boolean
  bookFix(workshop: IWorkshop, date: Date): void
}>()
const {workshop} = toRefs(props)

const citiesFromJsonStore = useCitiesJsonStore()

const {t} = useI18n()

const showDialog = ref(false)

const getCityName = computed(() => citiesFromJsonStore.getCityName(workshop.value?.city || ''))
</script>

<template>
  <v-card
      variant="tonal"
      elevation="10"
  >
    <v-card-title align="center" class="font-weight-bold">
      {{ workshop.name }}
    </v-card-title>

    <v-card-text>
      <div class="mb-2">
        <v-icon
            icon="mdi-routes"
            color="primary"
            class="mx-2"
        ></v-icon>
        {{ getCityName }} {{ workshop.address }}
      </div>

      <div class="mb-2">
        <v-icon
            icon="mdi-phone"
            color="primary"
            class="mx-2"
        ></v-icon>
        {{ workshop.phone }}
      </div>

      <div class="mb-1">
        <!--        <v-icon-->
        <!--            icon="mdi-tools"-->
        <!--            color="primary"-->
        <!--            class="mx-2"-->
        <!--        ></v-icon>-->
        <v-chip-group>
          <v-chip
              v-for="(item) in workshop.services"
              density="comfortable"
              class="mr-1 my-2"
          >
            {{ services(t).find(x => x.value === item)?.title || '' }}
          </v-chip>
        </v-chip-group>
      </div>

      <div v-if="!isPresentation" align="center" class="my-2">
        <v-btn
            prepend-icon="mdi-calendar"
            density="comfortable"
            @click="showDialog = true"
        >
          {{ t('userBookFix.stepper.third.availableDates') }}
        </v-btn>
      </div>

    </v-card-text>
  </v-card>

  <free-dates
      v-model="showDialog"
      :workshop="workshop"
      :bookFix="bookFix"
  />
</template>

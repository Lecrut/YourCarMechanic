<script setup lang="ts">
import type {ICar} from "~/models/car";
import AddCarForm from "~/components/user/addCarForm.vue";

const props = defineProps<{
  car: ICar
  onlyShow: boolean
}>()
const {car} = toRefs(props)

const {t} = useI18n()

const isShowEditCarForm = ref(false)
</script>

<template>
  <v-card
      variant="tonal"
      class="rounded-lg"
  >
    <v-card-title class="mt-2">
      <v-icon
          icon="mdi-car"
          color="primary"
          class="mx-2 mb-2"
      ></v-icon>
    </v-card-title>

    <v-card-text>
      <div class="font-weight-bold">
        {{ car.manufacturer }} {{ car.model }}
      </div>
      <div>
        {{ car.productionYear }}
      </div>
      <div>
        {{ car.vin ? car.vin : t('userProfile.vinNotDefined') }}
      </div>

      <div class="my-2" align="center">
        <v-btn size="small" class="mx-2" prepend-icon="mdi-pencil" @click="isShowEditCarForm=true">
          {{ t('universal.edit') }}
        </v-btn>

        <!--        <v-btn size="small" class="mx-2" prepend-icon="mdi-history">-->
        <!--          {{ t('universal.history') }}-->
        <!--        </v-btn>-->
      </div>

    </v-card-text>
  </v-card>

  <add-car-form
      v-model="isShowEditCarForm"
      :car="car"
  />
</template>

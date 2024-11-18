<script setup lang="ts">
import type {ICar} from "~/models/car";
import AddCarForm from "~/components/user/addCarForm.vue";

const props = defineProps<{ car: ICar }>()
const {car} = toRefs(props)

const {t} = useI18n()

const isShowEditCarForm = ref(false)
</script>

<template>
  <v-card variant="tonal" class="rounded-lg">
    <v-card-title class="mt-2">
      {{ car.manufacturer }} {{ car.model }}
    </v-card-title>

    <v-card-text>
      <div>
        {{ car.productionYear }}
      </div>
      <div>
        {{ car.vin ? car.vin : t('userProfile.vinNotDefined') }}
      </div>

      <div class="my-2">
        <v-btn size="small" class="mx-2" prepend-icon="mdi-pencil" @click="isShowEditCarForm=true">
          {{ t('universal.edit') }}
        </v-btn>

        <v-btn size="small" class="mx-2" prepend-icon="mdi-history">
          {{ t('universal.history') }}
        </v-btn>
      </div>

    </v-card-text>
  </v-card>

  <add-car-form
      v-model="isShowEditCarForm"
      :car="car"
  />
</template>

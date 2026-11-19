<script setup lang="ts">
import type { ICar } from '~/models/car'
import AddCarForm from '~/components/user/addCarForm.vue'

defineProps<{
  car: ICar
  onlyShow: boolean
}>()

const { t } = useI18n()

const isShowEditCarForm = ref(false)
const confirmDelete = ref(false)

const carsStore = useCarsStore()
const { loading } = storeToRefs(useSharedStore())

async function deleteCar(car: ICar) {
  await carsStore.deleteCar(car)
  confirmDelete.value = false
}
</script>

<template>
  <v-card
    variant="tonal"
    :hover="!onlyShow"
    class="my-2"
  >
    <v-card-title class="mt-2">
      <v-icon
        icon="mdi-car"
        color="primary"
        class="mx-2 mb-2"
      />
    </v-card-title>

    <v-card-text>
      <div class="font-weight-bold">
        {{ car.manufacturer }} {{ car.model }}
      </div>
      <div>{{ car.productionYear }}</div>
      <div>{{ car.vin || t('userProfile.vinNotDefined') }}</div>

      <div
        v-if="!onlyShow"
        class="my-2 text-center"
      >
        <v-btn
          size="small"
          class="mx-1"
          variant="tonal"
          prepend-icon="mdi-pencil"
          data-testid="edit-car"
          @click="isShowEditCarForm = true"
        >
          {{ t('universal.edit') }}
        </v-btn>
        <v-btn
          v-tooltip="t('userProfile.deleteCar')"
          size="small"
          class="mx-1"
          variant="text"
          color="error"
          icon="mdi-delete-outline"
          :aria-label="t('userProfile.deleteCar')"
          data-testid="delete-car"
          @click="confirmDelete = true"
        />
      </div>
    </v-card-text>
  </v-card>

  <v-dialog
    v-model="confirmDelete"
    max-width="440"
  >
    <v-card
      :title="t('userProfile.deleteCarTitle')"
      :text="t('userProfile.deleteCarText', { car: `${car.manufacturer} ${car.model}` })"
      prepend-icon="mdi-car-off"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="confirmDelete = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          color="error"
          :loading="loading"
          data-testid="confirm-delete-car"
          @click="deleteCar(car)"
        >
          {{ t('moderator.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <add-car-form
    v-if="!onlyShow"
    v-model="isShowEditCarForm"
    :car="car"
  />
</template>

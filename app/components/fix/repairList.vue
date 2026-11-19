<script setup lang="ts">
import type { IFix, ViewerMode } from '~/models/fix'
import RepairCard from '~/components/fix/repairCard.vue'

defineProps<{
  fixes: IFix[]
  mode: ViewerMode
  loading?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="loading && !fixes.length"
    class="text-center py-10"
  >
    <v-progress-circular
      :size="50"
      color="primary"
      indeterminate
    />
  </div>

  <v-empty-state
    v-else-if="!fixes.length"
    icon="mdi-car-off"
    :title="t('repairs.empty')"
    data-testid="repairs-empty"
  />

  <v-row v-else>
    <v-fade-transition group>
      <v-col
        v-for="fix in fixes"
        :key="fix.reference"
        cols="12"
        md="6"
        lg="4"
      >
        <repair-card
          :fix="fix"
          :mode="mode"
        />
      </v-col>
    </v-fade-transition>
  </v-row>
</template>

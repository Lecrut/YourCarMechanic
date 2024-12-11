<script setup lang="ts">
import type {IFix} from "~/models/fix";
import CarCard from "~/components/user/carCard.vue";

const isDialogShown = defineModel<boolean>()

const props = defineProps<{
  fix: IFix
  isCompany: boolean
}>()

const {fix} = toRefs(props)

const {t} = useI18n()

function close() {
  isDialogShown.value = false
}
</script>

<template>
  <v-dialog
      max-width="1100px"
      :model-value="isDialogShown"
      scrollable
      @update:model-value="close">
    <v-card>
      <v-card-title>

      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="5" sm="12" align="center">
            <car-card :only-show="true" :car="fix.car"/>
          </v-col>

          <v-col cols="12" md="7" sm="12">

          </v-col>
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

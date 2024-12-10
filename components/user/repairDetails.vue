<script setup lang="ts">
import type {IFix} from "~/models/fix";

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

      <!--todo: show card card, workshop card, description and all data-->
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

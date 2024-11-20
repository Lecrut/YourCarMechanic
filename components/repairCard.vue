<script setup lang="ts">
import type {IFix} from "~/models/fix";

const props = defineProps<{
  fix: IFix,
  isCompany: boolean
}>()

const {fix} = toRefs(props)
</script>

<template>
  <v-card>

  </v-card>
</template>

<style scoped>

</style>
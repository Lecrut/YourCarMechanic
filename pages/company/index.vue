<script setup lang="ts">
definePageMeta({
  layout: 'company',
})

const {t} = useI18n()

const authStore = useAuthStore()
const {company} = storeToRefs(authStore)

const fixStore = useFixesStore()
const {fixes} = storeToRefs(fixStore)

onMounted(async () => {
  if (company.value)
    await fixStore.getWorkshopFixes(company.value)
})

</script>

<template>
  <!--  todo: add filters and for instance search in previous-->
  <v-card-text>
    <v-row justify="center">
      <v-col
          v-for="(item) in fixes"
          cols="12"
          lg="4"
          md="6"
          sm="12"
      >
        <repair-card
            :is-company="true"
            :fix="item"
        />
      </v-col>
    </v-row>
  </v-card-text>
</template>

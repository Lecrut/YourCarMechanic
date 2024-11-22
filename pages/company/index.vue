<script setup lang="ts">
definePageMeta({
  layout: 'company',
})

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

</template>

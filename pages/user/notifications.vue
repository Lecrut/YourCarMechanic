<script setup lang="ts">
definePageMeta({
  layout: 'user',
})

const authStore = useAuthStore()
const {user} = storeToRefs(authStore)

const fixStore = useFixesStore()
const {fixes} = storeToRefs(fixStore)

onMounted(async () => {
  if (user.value)
    await fixStore.getUserFixes(user.value)
})
</script>

<template>
  <v-container class="h-auto my-15">
    <v-card>

    </v-card>
  </v-container>
</template>

<style scoped>

</style>
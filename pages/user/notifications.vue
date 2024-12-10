<script setup lang="ts">
definePageMeta({
  layout: 'user',
})

const {t} = useI18n()

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
    <v-card
        class="pa-2"
    >
      <div class="text-h5 my-2">
        {{ t('notifications.title') }}
      </div>
      <v-row justify="center">
        <v-col
            v-for="(item) in fixes"
            cols="12"
            md="4"
            sm="12"
        >
          <repair-card
              :is-company="false"
              :fix="item"
          />
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

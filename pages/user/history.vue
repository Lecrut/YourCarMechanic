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
//   todo: get only historical fixes
})

</script>

<template>
  <v-container class="h-auto my-15">
    <v-card
        class="pa-5"
    >
      <v-card-title>
        <div class="text-h5 mb-2 " align="center">
          {{ t('history.title') }}
        </div>
      </v-card-title>
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
                :is-company="false"
                :fix="item"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

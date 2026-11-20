<script setup lang="ts">
import RepairList from '~/components/fix/repairList.vue'
import PageHeader from '~/components/common/pageHeader.vue'

definePageMeta({ middleware: ['auth'], role: 'user' })

const { t } = useI18n()

const authStore = useAuthStore()
const fixesStore = useFixesStore()
const { historyFixes } = storeToRefs(fixesStore)
const { loading } = storeToRefs(useSharedStore())

onMounted(() => {
  if (authStore.user) fixesStore.getUserHistoryFixes(authStore.user.reference)
})
</script>

<template>
  <v-container class="py-8">
    <page-header
      :title="t('history.title')"
      icon="mdi-history"
    />
    <repair-list
      :fixes="historyFixes"
      mode="user"
      :loading="loading"
    />
  </v-container>
</template>

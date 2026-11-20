<script setup lang="ts">
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import FixesTable from '~/components/moderator/fixesTable.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.fixes')"
    :subtitle="t('moderator.pages.fixes')"
    icon="mdi-car-wrench"
  >
    <fixes-table />
  </moderator-page>
</template>

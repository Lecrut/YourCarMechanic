<script setup lang="ts">
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import ServicesTable from '~/components/moderator/servicesTable.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.services')"
    :subtitle="t('moderator.pages.services')"
    icon="mdi-tools"
  >
    <services-table />
  </moderator-page>
</template>

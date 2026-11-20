<script setup lang="ts">
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import CompaniesTable from '~/components/moderator/companiesTable.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.companies')"
    :subtitle="t('moderator.pages.companies')"
    icon="mdi-garage"
  >
    <companies-table />
  </moderator-page>
</template>

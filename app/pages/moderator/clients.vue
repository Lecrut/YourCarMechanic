<script setup lang="ts">
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import UsersTable from '~/components/moderator/usersTable.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.users')"
    :subtitle="t('moderator.pages.users')"
    icon="mdi-account-group-outline"
  >
    <users-table />
  </moderator-page>
</template>

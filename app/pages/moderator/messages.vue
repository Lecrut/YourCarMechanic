<script setup lang="ts">
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import MessagesTable from '~/components/moderator/messagesTable.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.messages')"
    :subtitle="t('moderator.pages.messages')"
    icon="mdi-email-outline"
  >
    <messages-table />
  </moderator-page>
</template>

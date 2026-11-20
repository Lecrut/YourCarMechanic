<script setup lang="ts">
import ModeratorPage from '~/components/moderator/moderatorPage.vue'
import ReviewsTable from '~/components/moderator/reviewsTable.vue'

definePageMeta({ middleware: ['auth'], role: 'moderator' })

const { t } = useI18n()
</script>

<template>
  <moderator-page
    :title="t('moderator.tabs.reviews')"
    :subtitle="t('moderator.pages.reviews')"
    icon="mdi-star-outline"
  >
    <reviews-table />
  </moderator-page>
</template>

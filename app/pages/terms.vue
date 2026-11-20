<script setup lang="ts">
import PageHeader from '~/components/common/pageHeader.vue'
import MarkdownCard from '~/components/common/markdownCard.vue'
import source from '~/assets/legal/terms.md?raw'

const { t } = useI18n()
</script>

<template>
  <v-container
    class="py-8"
    max-width="900"
  >
    <page-header
      :title="t('footer.terms')"
      icon="mdi-file-document-outline"
    />
    <markdown-card :source="source" />
  </v-container>
</template>

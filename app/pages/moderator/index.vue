<script setup lang="ts">
/** `/moderator` – every section has its own page; start with the statistics. */
definePageMeta({ middleware: ['auth'], role: 'moderator', redirect: '/moderator/stats' })
</script>

<template>
  <div />
</template>

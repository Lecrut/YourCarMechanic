<script setup lang="ts">
import RepairList from '~/components/fix/repairList.vue'
import PageHeader from '~/components/pageHeader.vue'
import { awaitsClientDecision } from '~/models/fix'

definePageMeta({ middleware: ['auth'], role: 'user' })

const { t } = useI18n()

const authStore = useAuthStore()
const fixesStore = useFixesStore()
const { fixes, watching } = storeToRefs(fixesStore)

const decisions = computed(() => fixes.value.filter(awaitsClientDecision).length)

// Live: statuses and proposals from the workshop appear without reloading.
onMounted(() => {
  if (authStore.user) fixesStore.watchActive('userRef', authStore.user.reference)
})
onUnmounted(() => fixesStore.stopWatching())
</script>

<template>
  <v-container class="py-8">
    <page-header
      :title="t('notifications.title')"
      icon="mdi-bell"
    >
      <v-btn
        to="/user"
        prepend-icon="mdi-plus"
      >
        {{ t('navBar.user.bookedFix') }}
      </v-btn>
    </page-header>

    <v-expand-transition>
      <v-alert
        v-if="decisions"
        type="warning"
        variant="tonal"
        icon="mdi-bell-alert"
        class="mb-6"
        :text="t('proposal.decisionsWaiting', { count: decisions })"
      />
    </v-expand-transition>

    <repair-list
      :fixes="fixes"
      mode="user"
      :loading="watching"
    />
  </v-container>
</template>

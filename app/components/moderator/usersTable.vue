<script setup lang="ts">
import type { IUser, UserRole } from '~/types/user'
import { formatDateToString } from '~/utils/time'

/** Every account with its activity – the moderator's client list. */
const { t } = useI18n()

const moderatorStore = useModeratorStore()
const { users, cars, fixes } = storeToRefs(moderatorStore)
const authStore = useAuthStore()
const { loading } = storeToRefs(useSharedStore())

const search = ref('')
const roleFilter = ref<UserRole | 'none' | null>(null)

const roleOptions = computed(() => [
  { title: t('roles.none'), value: null },
  ...(['user', 'workshop', 'moderator'] as UserRole[]).map(r => ({ title: t(`roles.${r}`), value: r })),
])
const roleFilterOptions = computed(() => [
  { title: t('roles.user'), value: 'user' as const },
  { title: t('roles.none'), value: 'none' as const },
])

const roleColor: Record<string, string> = { user: 'primary', workshop: 'secondary', moderator: 'warning' }

const stats = computed(() => {
  const map = new Map<string, { fixes: number, lastVisit: Date | null, cars: number }>()
  for (const u of users.value) map.set(u.reference, { fixes: 0, lastVisit: null, cars: 0 })
  for (const f of fixes.value) {
    const s = map.get(f.userRef)
    if (!s) continue
    s.fixes++
    if (!s.lastVisit || f.date > s.lastVisit) s.lastVisit = f.date
  }
  for (const c of cars.value) {
    const s = map.get(c.userRef)
    if (s && !c.deletedAt) s.cars++
  }
  return map
})

const items = computed(() => users.value.filter((u) => {
  if (u.role === 'workshop' || u.role === 'moderator') return false
  if (!roleFilter.value) return true
  return roleFilter.value === 'none' ? !u.role : u.role === roleFilter.value
}))

const headers = computed(() => [
  { title: t('userProfile.email'), key: 'email' },
  { title: t('moderator.fullName'), key: 'name', value: (u: IUser) => `${u.profile?.name ?? ''} ${u.profile?.surname ?? ''}`.trim() },
  { title: t('userProfile.userPhone'), key: 'phone', value: (u: IUser) => u.profile?.phone ?? '', sortable: false },
  { title: t('moderator.cars'), key: 'cars', value: (u: IUser) => stats.value.get(u.reference)?.cars ?? 0 },
  { title: t('clients.visits'), key: 'fixes', value: (u: IUser) => stats.value.get(u.reference)?.fixes ?? 0 },
  { title: t('clients.lastVisit'), key: 'lastVisit', value: (u: IUser) => stats.value.get(u.reference)?.lastVisit?.getTime() ?? 0 },
  { title: t('moderator.role'), key: 'role', width: 210 },
])
</script>

<template>
  <v-row class="mb-4">
    <v-col
      cols="12"
      md="8"
    >
      <v-text-field
        v-model="search"
        :label="t('moderator.search')"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      md="4"
    >
      <v-select
        v-model="roleFilter"
        :items="roleFilterOptions"
        :label="t('moderator.role')"
        prepend-inner-icon="mdi-filter-variant"
        clearable
        hide-details
      />
    </v-col>
  </v-row>

  <v-data-table
    :headers="headers"
    :items="items"
    :search="search"
    :loading="loading"
    item-value="reference"
    hover
    data-testid="users-table"
  >
    <template #[`item.email`]="{ item }">
      <div class="d-flex align-center ga-2">
        <v-avatar
          :color="roleColor[item.role ?? ''] ?? 'surface-variant'"
          size="28"
          variant="tonal"
        >
          <span class="text-label-medium">{{ (item.profile?.name || item.email).charAt(0).toUpperCase() }}</span>
        </v-avatar>
        <span class="text-break">{{ item.email }}</span>
      </div>
    </template>

    <template #[`item.phone`]="{ item }">
      <a
        v-if="item.profile?.phone"
        v-tooltip="t('clients.call')"
        :href="`tel:${item.profile.phone}`"
        class="text-primary text-decoration-none"
      >{{ item.profile.phone }}</a>
    </template>

    <template #[`item.lastVisit`]="{ item }">
      {{ stats.get(item.reference)?.lastVisit ? formatDateToString(stats.get(item.reference)!.lastVisit!) : '—' }}
    </template>

    <template #[`item.role`]="{ item }">
      <v-select
        v-tooltip:top="item.reference === authStore.user?.reference ? t('moderator.ownRole') : t('moderator.roleHint')"
        :model-value="item.role"
        :items="roleOptions"
        density="compact"
        variant="solo-filled"
        flat
        hide-details
        :disabled="item.reference === authStore.user?.reference"
        @update:model-value="(role: UserRole | null) => moderatorStore.setUserRole(item, role)"
      />
    </template>
  </v-data-table>
</template>

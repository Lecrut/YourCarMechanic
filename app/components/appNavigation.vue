<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify'
import { awaitsClientDecision } from '~/models/fix'

interface NavItem {
  title: string
  icon: string
  to: string
  badge?: number
}

const { t, locale, locales, setLocale } = useI18n()
const theme = useTheme()
const { mdAndUp } = useDisplay()
const route = useRoute()

const authStore = useAuthStore()
const { user, role, company } = storeToRefs(authStore)
const fixesStore = useFixesStore()
const moderatorStore = useModeratorStore()

const drawer = ref(false)

const decisionCount = computed(() => fixesStore.fixes.filter(awaitsClientDecision).length)

const items = computed<NavItem[]>(() => {
  switch (role.value) {
    case 'user':
      return [
        { title: t('navBar.user.bookedFix'), icon: 'mdi-calendar-plus', to: '/user' },
        { title: t('navBar.notifications'), icon: 'mdi-bell-outline', to: '/user/notifications', badge: decisionCount.value },
        { title: t('navBar.user.history'), icon: 'mdi-history', to: '/user/history' },
        { title: t('navBar.user.profile'), icon: 'mdi-account-outline', to: '/user/profile' },
      ]
    case 'workshop':
      return [
        { title: t('navBar.company.repairs'), icon: 'mdi-car-wrench', to: '/company' },
        { title: t('navBar.company.clients'), icon: 'mdi-account-group-outline', to: '/company/clients' },
        { title: t('navBar.company.pricing'), icon: 'mdi-cash-multiple', to: '/company/pricing' },
        { title: t('navBar.company.profile'), icon: 'mdi-domain', to: '/company/profile' },
      ]
    case 'moderator':
      return [
        { title: t('moderator.tabs.stats'), icon: 'mdi-chart-box-outline', to: '/moderator?tab=stats' },
        { title: t('moderator.tabs.companies'), icon: 'mdi-garage', to: '/moderator?tab=companies', badge: moderatorStore.pendingWorkshops.length },
        { title: t('moderator.tabs.services'), icon: 'mdi-tools', to: '/moderator?tab=services' },
        { title: t('moderator.tabs.users'), icon: 'mdi-account-group-outline', to: '/moderator?tab=users' },
        { title: t('moderator.tabs.fixes'), icon: 'mdi-car-wrench', to: '/moderator?tab=fixes' },
        { title: t('moderator.tabs.reviews'), icon: 'mdi-star-outline', to: '/moderator?tab=reviews' },
      ]
    default:
      return []
  }
})

const guestLinks = computed<NavItem[]>(() => [
  { title: t('navBar.home'), icon: 'mdi-home-outline', to: '/' },
  { title: t('navBar.about'), icon: 'mdi-information-outline', to: '/about' },
])

const hasSidebar = computed(() => Boolean(user.value && items.value.length))

const initials = computed(() => {
  const p = user.value?.profile
  if (p?.name) return `${p.name.charAt(0)}${p.surname.charAt(0)}`.toUpperCase()
  return (user.value?.email.charAt(0) ?? '?').toUpperCase()
})

const roleColor = computed(() => ({ user: 'primary', workshop: 'secondary', moderator: 'warning' })[role.value ?? 'user'] ?? 'primary')

const isActive = (item: NavItem) => route.fullPath === item.to
  || (item.to.includes('?') ? false : route.path === item.to && !route.query.tab)

function toggleTheme() {
  theme.change(theme.global.current.value.dark ? 'light' : 'dark')
  try {
    localStorage.setItem('current-theme', theme.global.name.value)
  }
  catch {
    // storage unavailable (private mode) – theme just won't be remembered
  }
}

async function logOut() {
  await authStore.logOut()
  await navigateTo('/')
}
</script>

<template>
  <v-app-bar
    flat
    border="b"
    scroll-behavior="elevate"
    density="comfortable"
  >
    <v-app-bar-nav-icon
      v-if="hasSidebar && !mdAndUp"
      v-tooltip:bottom="t('navBar.menu')"
      :aria-label="t('navBar.menu')"
      @click="drawer = !drawer"
    />

    <v-app-bar-title>
      <nuxt-link
        :to="user ? authStore.homePath : '/'"
        class="d-inline-flex align-center ga-2 text-decoration-none text-high-emphasis"
      >
        <v-avatar
          color="primary"
          size="34"
          rounded="lg"
        >
          <v-icon
            icon="mdi-car-wrench"
            size="20"
          />
        </v-avatar>
        <span class="font-weight-bold">{{ t('navBar.title') }}</span>
      </nuxt-link>
    </v-app-bar-title>

    <div
      v-if="!user"
      class="d-none d-md-flex ga-1 mr-2"
    >
      <v-btn
        v-for="link in guestLinks"
        :key="link.to"
        :to="link.to"
        variant="text"
        color="default"
        rounded="xl"
        exact
      >
        {{ link.title }}
      </v-btn>
    </div>

    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-tooltip:bottom="t('navBar.language')"
          v-bind="menuProps"
          icon="mdi-translate"
          variant="text"
          color="default"
          :aria-label="t('navBar.language')"
        />
      </template>
      <v-list
        density="compact"
        nav
        rounded="lg"
      >
        <v-list-item
          v-for="l in locales"
          :key="l.code"
          :title="l.name"
          :active="l.code === locale"
          :append-icon="l.code === locale ? 'mdi-check' : undefined"
          color="primary"
          rounded="lg"
          @click="setLocale(l.code)"
        />
      </v-list>
    </v-menu>

    <v-btn
      v-tooltip:bottom="t('navBar.changeTheme')"
      :icon="theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
      variant="text"
      color="default"
      :aria-label="t('navBar.changeTheme')"
      @click="toggleTheme"
    />

    <template v-if="!user">
      <v-btn
        to="/auth/login"
        variant="text"
        rounded="xl"
        class="ml-1"
      >
        {{ t('navBar.login') }}
      </v-btn>
      <v-btn
        to="/auth/register"
        rounded="xl"
        class="mx-2 d-none d-sm-flex"
      >
        {{ t('register.button') }}
      </v-btn>
    </template>

    <v-menu
      v-else
      location="bottom end"
      :close-on-content-click="true"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-tooltip:bottom="t('navBar.account')"
          v-bind="menuProps"
          icon
          class="mx-2"
          data-testid="account-menu"
          :aria-label="t('navBar.account')"
        >
          <v-avatar
            :color="roleColor"
            size="36"
          >
            <span class="text-label-large font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </v-btn>
      </template>

      <v-card
        min-width="280"
        rounded="xl"
      >
        <v-card-item>
          <template #prepend>
            <v-avatar
              :color="roleColor"
              size="48"
            >
              <span class="text-title-medium font-weight-bold">{{ initials }}</span>
            </v-avatar>
          </template>
          <v-card-title>
            {{ user.profile?.name ? `${user.profile.name} ${user.profile.surname}` : user.email }}
          </v-card-title>
          <v-card-subtitle>{{ user.email }}</v-card-subtitle>
        </v-card-item>

        <v-card-text class="pt-0">
          <v-chip
            v-if="role"
            :color="roleColor"
            size="small"
            variant="tonal"
            prepend-icon="mdi-shield-check-outline"
          >
            {{ t(`roles.${role}`) }}
          </v-chip>
          <v-chip
            v-if="company"
            size="small"
            variant="tonal"
            class="ml-1"
            prepend-icon="mdi-domain"
          >
            {{ company.name }}
          </v-chip>
        </v-card-text>

        <v-divider />

        <v-list
          density="compact"
          nav
        >
          <v-list-item
            v-for="item in items.slice(0, 4)"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
          />
          <v-divider class="my-1" />
          <v-list-item
            prepend-icon="mdi-logout"
            :title="t('navBar.logOut')"
            base-color="error"
            rounded="lg"
            data-testid="logout"
            @click="logOut"
          />
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-navigation-drawer
    v-if="hasSidebar"
    v-model="drawer"
    :permanent="mdAndUp"
    :rail="mdAndUp"
    :expand-on-hover="mdAndUp"
    width="260"
    border="e"
  >
    <v-list
      nav
      density="comfortable"
      class="mt-2"
    >
      <v-list-item
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :title="item.title"
        :active="isActive(item)"
        color="primary"
        rounded="xl"
        :data-testid="`nav-${item.to}`"
      >
        <template #prepend>
          <v-badge
            v-if="item.badge"
            :content="item.badge"
            color="error"
            floating
          >
            <v-icon :icon="item.icon" />
          </v-badge>
          <v-icon
            v-else
            :icon="item.icon"
          />
        </template>
      </v-list-item>
    </v-list>

    <template #append>
      <v-list
        nav
        density="comfortable"
      >
        <v-list-item
          prepend-icon="mdi-logout"
          :title="t('navBar.logOut')"
          base-color="error"
          rounded="xl"
          @click="logOut"
        />
      </v-list>
    </template>
  </v-navigation-drawer>

  <v-bottom-navigation
    v-if="hasSidebar && !mdAndUp"
    mode="shift"
    color="primary"
    grow
    elevation="8"
  >
    <v-btn
      v-for="item in items.slice(0, 4)"
      :key="item.to"
      :to="item.to"
      :value="item.to"
    >
      <v-badge
        v-if="item.badge"
        :content="item.badge"
        color="error"
      >
        <v-icon :icon="item.icon" />
      </v-badge>
      <v-icon
        v-else
        :icon="item.icon"
      />
      <span>{{ item.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

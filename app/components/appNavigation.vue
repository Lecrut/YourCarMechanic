<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify'
import { awaitsClientDecision } from '~/models/fix'
import NotificationBell from '~/components/notificationBell.vue'
import { useLanguage } from '~/composables/language'

interface NavItem {
  title: string
  icon: string
  to: string
  badge?: number
}

const { t, locale } = useI18n()
/** Guests pick the language in the bar; signed-in users in their account settings. */
const { languages, current: currentLanguage, setLanguage } = useLanguage()
const theme = useTheme()
const { mdAndUp } = useDisplay()
const route = useRoute()

const authStore = useAuthStore()
const { user, role, company } = storeToRefs(authStore)
const fixesStore = useFixesStore()
const moderatorStore = useModeratorStore()
const contactStore = useContactStore()

const drawer = ref(false)

const decisionCount = computed(() => fixesStore.fixes.filter(awaitsClientDecision).length)
/** New bookings the workshop has not reacted to yet. */
const toAcceptCount = computed(() => fixesStore.fixes.filter(f => !f.notifications.length && f.confirmed).length)

const items = computed<NavItem[]>(() => {
  switch (role.value) {
    case 'user':
      return [
        { title: t('navBar.user.bookedFix'), icon: 'mdi-calendar-plus', to: '/user' },
        { title: t('navBar.notifications'), icon: 'mdi-garage-variant', to: '/user/notifications', badge: decisionCount.value },
        { title: t('navBar.user.history'), icon: 'mdi-history', to: '/user/history' },
        { title: t('navBar.user.profile'), icon: 'mdi-account-outline', to: '/user/profile' },
      ]
    case 'workshop':
      return [
        { title: t('navBar.company.repairs'), icon: 'mdi-car-wrench', to: '/company', badge: toAcceptCount.value },
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
        { title: t('moderator.tabs.messages'), icon: 'mdi-email-outline', to: '/moderator?tab=messages', badge: contactStore.newCount },
        { title: t('navBar.user.profile'), icon: 'mdi-account-outline', to: '/moderator/profile' },
      ]
    default:
      return []
  }
})

/** Centre of the app bar for guests (signed-in users navigate with the side rail / bottom bar). */
const guestLinks = computed<NavItem[]>(() => [
  { title: t('navBar.home'), icon: 'mdi-home-outline', to: '/' },
  { title: t('navBar.workshops'), icon: 'mdi-garage', to: '/workshops' },
  { title: t('navBar.about'), icon: 'mdi-information-outline', to: '/about' },
  { title: t('navBar.contact'), icon: 'mdi-email-outline', to: '/contact' },
])

/** Tab matching the current page – drives the animated slider under the centre tabs. */
const activeLink = computed(() => guestLinks.value.find(l => l.to === route.path)?.to ?? null)

/** Selected entry of the phone bottom bar (highlight + label in "shift" mode). */
const bottomSelected = computed(() => items.value.slice(0, 4).find(isActive)?.to ?? null)

const logoHover = ref(false)
const isDark = computed(() => theme.global.current.value.dark)

/** Own profile page of every role – always reachable from the account menu. */
const PROFILE_PATHS: Record<string, string> = { user: '/user/profile', workshop: '/company/profile', moderator: '/moderator/profile' }
const profilePath = computed(() => (role.value ? PROFILE_PATHS[role.value] ?? null : null))
/** Account-menu shortcuts: the role's main pages without the profile (it has its own entry). */
const shortcuts = computed(() => items.value.filter(i => i.to !== profilePath.value).slice(0, 4))

const hasSidebar = computed(() => Boolean(user.value && items.value.length))

const initials = computed(() => {
  const p = user.value?.profile
  if (p?.name) return `${p.name.charAt(0)}${p.surname.charAt(0)}`.toUpperCase()
  return (user.value?.email.charAt(0) ?? '?').toUpperCase()
})

const roleColor = computed(() => ({ user: 'primary', workshop: 'secondary', moderator: 'warning' })[role.value ?? 'user'] ?? 'primary')

/**
 * Router links match by path only, so every `/moderator?tab=…` entry would light up on `/moderator`.
 * Compare the tab ourselves; no tab in the URL means the page's first tab.
 */
function isActive(item: NavItem) {
  const [path, query = ''] = item.to.split('?')
  if (route.path !== path) return false
  const tab = new URLSearchParams(query).get('tab')
  if (!tab) return !route.query.tab
  const firstTab = new URLSearchParams(items.value.find(i => i.to.startsWith(`${path}?`))?.to.split('?')[1] ?? '').get('tab')
  return (typeof route.query.tab === 'string' ? route.query.tab : firstTab) === tab
}

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
    <div class="d-flex align-center flex-1-1-0 ga-1 ps-2">
      <v-app-bar-nav-icon
        v-if="hasSidebar && !mdAndUp"
        v-tooltip:bottom="t('navBar.menu')"
        :aria-label="t('navBar.menu')"
        @click="drawer = !drawer"
      />

      <nuxt-link
        :to="user ? authStore.homePath : '/'"
        class="d-inline-flex align-center ga-2 text-decoration-none text-high-emphasis"
        data-testid="logo"
        @mouseenter="logoHover = true"
        @mouseleave="logoHover = false"
      >
        <v-avatar
          :color="logoHover ? 'secondary' : 'primary'"
          size="36"
          rounded="lg"
          :class="`elevation-${logoHover ? 6 : 2}`"
        >
          <v-scale-transition
            mode="out-in"
            origin="center"
          >
            <v-icon
              :key="logoHover ? 'hover' : 'idle'"
              :icon="logoHover ? 'mdi-car-sports' : 'mdi-car-wrench'"
              size="20"
            />
          </v-scale-transition>
        </v-avatar>
        <span class="text-title-medium font-weight-bold d-none d-sm-inline">{{ t('navBar.title') }}</span>
      </nuxt-link>
    </div>

    <v-sheet
      v-if="!user"
      class="d-none d-md-flex flex-0-0 pa-1"
      rounded="pill"
      color="surface-light"
      border
      data-testid="center-nav"
    >
      <v-tabs
        :model-value="activeLink"
        :mandatory="false"
        density="compact"
        color="primary"
        slider-color="primary"
        height="40"
      >
        <v-tab
          v-for="link in guestLinks"
          :key="link.to"
          :value="link.to"
          :to="link.to"
          :prepend-icon="link.icon"
          rounded="pill"
          class="text-none"
          exact
        >
          {{ link.title }}
        </v-tab>
      </v-tabs>
    </v-sheet>

    <div class="d-flex align-center justify-end flex-1-1-0 ga-2 pe-2">
      <v-sheet
        class="d-flex align-center pa-1 ga-1"
        rounded="pill"
        color="surface-light"
        border
        data-testid="nav-controls"
      >
        <v-menu
          v-if="!user"
          location="bottom end"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-tooltip:bottom="t('navBar.language')"
              v-bind="menuProps"
              variant="text"
              color="default"
              rounded="pill"
              height="36"
              class="px-2"
              :aria-label="t('navBar.language')"
              data-testid="language-menu"
            >
              <v-avatar
                :image="currentLanguage.flag"
                size="22"
                class="elevation-1"
              />
              <span class="ms-2 text-label-large font-weight-bold d-none d-sm-inline">{{ currentLanguage.code.toUpperCase() }}</span>
              <v-icon
                icon="mdi-chevron-down"
                size="16"
                class="ms-1"
              />
            </v-btn>
          </template>
          <v-list
            density="comfortable"
            nav
            rounded="xl"
            min-width="200"
            class="pa-2"
          >
            <v-list-item
              v-for="l in languages"
              :key="l.code"
              :title="l.name"
              :subtitle="l.code.toUpperCase()"
              :active="l.code === locale"
              color="primary"
              rounded="lg"
              :data-testid="`language-${l.code}`"
              @click="setLanguage(l.code)"
            >
              <template #prepend>
                <v-avatar
                  :image="l.flag"
                  size="28"
                  class="elevation-1"
                />
              </template>
              <template #append>
                <v-scale-transition>
                  <v-icon
                    v-if="l.code === locale"
                    icon="mdi-check-circle"
                    color="primary"
                  />
                </v-scale-transition>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn
          v-tooltip:bottom="isDark ? t('navBar.lightTheme') : t('navBar.darkTheme')"
          variant="text"
          :color="isDark ? 'amber' : 'indigo'"
          icon
          size="36"
          :aria-label="t('navBar.changeTheme')"
          data-testid="theme-toggle"
          @click="toggleTheme"
        >
          <v-scroll-y-transition
            mode="out-in"
            hide-on-leave
          >
            <v-icon
              :key="isDark ? 'sun' : 'moon'"
              :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"
            />
          </v-scroll-y-transition>
        </v-btn>

        <notification-bell v-if="role === 'user' || role === 'workshop'" />
      </v-sheet>

      <template v-if="!user">
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-tooltip:bottom="t('navBar.menu')"
              v-bind="menuProps"
              icon="mdi-menu"
              variant="tonal"
              size="40"
              class="d-md-none"
              :aria-label="t('navBar.menu')"
              data-testid="guest-menu"
            />
          </template>
          <v-list
            nav
            rounded="xl"
            min-width="220"
            class="pa-2"
          >
            <v-list-item
              v-for="link in guestLinks"
              :key="link.to"
              :to="link.to"
              :prepend-icon="link.icon"
              :title="link.title"
              color="primary"
              rounded="lg"
            />
            <v-divider class="my-1" />
            <v-list-item
              to="/auth/login"
              prepend-icon="mdi-login"
              :title="t('navBar.login')"
              rounded="lg"
            />
          </v-list>
        </v-menu>
        <v-btn
          to="/auth/login"
          variant="text"
          prepend-icon="mdi-login"
          class="d-none d-sm-flex"
        >
          {{ t('navBar.login') }}
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
            size="44"
            data-testid="account-menu"
            :aria-label="t('navBar.account')"
          >
            <v-badge
              dot
              color="success"
              location="bottom end"
              offset-x="3"
              offset-y="3"
            >
              <v-avatar
                :color="roleColor"
                size="38"
                class="elevation-2"
              >
                <span class="text-label-large font-weight-bold">{{ initials }}</span>
              </v-avatar>
            </v-badge>
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
              v-if="profilePath"
              :to="profilePath"
              prepend-icon="mdi-account-circle-outline"
              :title="t('account.myProfile')"
              rounded="lg"
              data-testid="my-profile"
            />
            <v-list-item
              v-for="item in shortcuts"
              :key="item.to"
              :to="item.to"
              :active="isActive(item)"
              color="primary"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="lg"
            />
            <v-divider class="my-1" />
            <v-list-item
              to="/contact"
              prepend-icon="mdi-lifebuoy"
              :title="t('navBar.contact')"
              rounded="lg"
            />
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
    </div>
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
    :model-value="bottomSelected"
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
      :active="isActive(item)"
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

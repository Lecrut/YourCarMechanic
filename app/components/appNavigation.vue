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

/**
 * Navigation rules:
 * - guests: centre links + language flags + log in (footer comes from the layout);
 * - signed in, desktop: side rail with the role's pages; the avatar menu has only
 *   my profile, contact and log out;
 * - signed in, small screens: no side drawer – the bottom bar holds up to 4 pages, the rest of the
 *   role's pages are listed in the avatar menu (above profile, contact, log out).
 */
const { t, locale } = useI18n()
/** Guests pick the language in the bar; signed-in users in their account settings. */
const { languages, current: currentLanguage, setLanguage } = useLanguage()
const theme = useTheme()
const { mdAndUp } = useDisplay()
const route = useRoute()

const authStore = useAuthStore()
const { user, company, role } = storeToRefs(authStore)
const fixesStore = useFixesStore()
const moderatorStore = useModeratorStore()
const contactStore = useContactStore()

const decisionCount = computed(() => fixesStore.fixes.filter(awaitsClientDecision).length)
/** New bookings the workshop has not reacted to yet. */
const toAcceptCount = computed(() => fixesStore.fixes.filter(f => !f.notifications.length && f.confirmed).length)

/** The role's pages (profile is not here – it lives in the avatar menu). */
const items = computed<NavItem[]>(() => {
  switch (role.value) {
    case 'user':
      return [
        { title: t('navBar.user.bookedFix'), icon: 'mdi-calendar-plus', to: '/user' },
        { title: t('navBar.notifications'), icon: 'mdi-garage-variant', to: '/user/notifications', badge: decisionCount.value },
        { title: t('navBar.user.history'), icon: 'mdi-history', to: '/user/history' },
      ]
    case 'workshop':
      return [
        { title: t('navBar.company.repairs'), icon: 'mdi-car-wrench', to: '/company', badge: toAcceptCount.value },
        { title: t('navBar.company.clients'), icon: 'mdi-account-group-outline', to: '/company/clients' },
        { title: t('navBar.company.pricing'), icon: 'mdi-cash-multiple', to: '/company/pricing' },
      ]
    case 'moderator':
      return [
        { title: t('moderator.tabs.stats'), icon: 'mdi-chart-box-outline', to: '/moderator/stats' },
        { title: t('moderator.tabs.companies'), icon: 'mdi-garage', to: '/moderator/companies', badge: moderatorStore.pendingWorkshops.length },
        { title: t('moderator.tabs.services'), icon: 'mdi-tools', to: '/moderator/services' },
        { title: t('moderator.tabs.users'), icon: 'mdi-account-group-outline', to: '/moderator/clients' },
        { title: t('moderator.tabs.fixes'), icon: 'mdi-car-wrench', to: '/moderator/repairs' },
        { title: t('moderator.tabs.reviews'), icon: 'mdi-star-outline', to: '/moderator/reviews' },
        { title: t('moderator.tabs.messages'), icon: 'mdi-email-outline', to: '/moderator/messages', badge: contactStore.newCount },
      ]
    default:
      return []
  }
})

/** Small screens: pages in the bottom bar (max 4). Moderator: repairs, companies, messages, statistics. */
const BOTTOM_ORDER: Record<string, string[]> = {
  moderator: ['/moderator/repairs', '/moderator/companies', '/moderator/messages', '/moderator/stats'],
}
const bottomItems = computed(() => {
  const order = BOTTOM_ORDER[role.value ?? '']
  if (!order) return items.value.slice(0, 4)
  return order.map(to => items.value.find(i => i.to === to)).filter((i): i is NavItem => Boolean(i))
})
/** Small screens: pages that did not fit the bottom bar – listed in the avatar menu. */
const overflowItems = computed(() => items.value.filter(i => !bottomItems.value.includes(i)))

/** Centre of the app bar for guests. */
const guestLinks = computed<NavItem[]>(() => [
  { title: t('navBar.home'), icon: 'mdi-home-outline', to: '/' },
  { title: t('navBar.workshops'), icon: 'mdi-garage', to: '/workshops' },
  { title: t('navBar.about'), icon: 'mdi-information-outline', to: '/about' },
  { title: t('navBar.contact'), icon: 'mdi-email-outline', to: '/contact' },
])

const isActive = (item: NavItem) => route.path === item.to
/** Tab matching the current page – drives the animated slider under the centre tabs. */
const activeLink = computed(() => guestLinks.value.find(isActive)?.to ?? null)
/** Selected entry of the bottom bar (highlight + label in "shift" mode). */
const bottomSelected = computed(() => bottomItems.value.find(isActive)?.to ?? null)

/** Own profile page of every role – in the avatar menu. */
const PROFILE_PATHS: Record<string, string> = { user: '/user/profile', workshop: '/company/profile', moderator: '/moderator/profile' }
const profilePath = computed(() => (role.value ? PROFILE_PATHS[role.value] ?? null : null))

const hasPages = computed(() => Boolean(user.value && items.value.length))

const logoHover = ref(false)
const isDark = computed(() => theme.global.current.value.dark)

const initials = computed(() => {
  if (role.value === 'workshop' && company.value?.name) {
    const words = company.value.name.trim().split(/\s+/)
    return words.length >= 2
      ? `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase()
      : company.value.name.slice(0, 2).toUpperCase()
  }
  const p = user.value?.profile
  if (p?.name) return `${p.name.charAt(0)}${p.surname.charAt(0)}`.toUpperCase()
  return (user.value?.email.charAt(0) ?? '?').toUpperCase()
})

const displayName = computed(() => {
  if (role.value === 'workshop' && company.value?.name) return company.value.name
  const p = user.value?.profile
  return p?.name ? `${p.name} ${p.surname}`.trim() : (user.value?.email ?? '')
})

const roleColor = computed(() => ({ user: 'primary', workshop: 'secondary', moderator: 'warning' })[role.value ?? 'user'] ?? 'primary')

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
    <div class="d-flex align-center flex-1-1-0 ga-1 ps-3">
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
      class="d-none d-md-flex flex-0-0 pa-1 px-2"
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
          min-width="260"
          rounded="xl"
          data-testid="account-card"
        >
          <v-card-item>
            <template #prepend>
              <v-avatar
                :color="roleColor"
                size="44"
              >
                <span class="text-title-medium font-weight-bold">{{ initials }}</span>
              </v-avatar>
            </template>
            <v-card-title>
              {{ displayName }}
            </v-card-title>
            <v-card-subtitle>{{ user.email }}</v-card-subtitle>
          </v-card-item>

          <v-divider />

          <v-list
            density="compact"
            nav
          >
            <template v-if="!mdAndUp && overflowItems.length">
              <v-list-item
                v-for="item in overflowItems"
                :key="item.to"
                :to="item.to"
                :prepend-icon="item.icon"
                :title="item.title"
                :active="isActive(item)"
                color="primary"
                rounded="lg"
                :data-testid="`menu-${item.to}`"
              />
              <v-divider class="my-1" />
            </template>
            <v-list-item
              v-if="profilePath"
              :to="profilePath"
              prepend-icon="mdi-account-circle-outline"
              :title="t('account.myProfile')"
              rounded="lg"
              data-testid="my-profile"
            />
            <v-list-item
              to="/contact"
              prepend-icon="mdi-lifebuoy"
              :title="t('navBar.contact')"
              rounded="lg"
              data-testid="menu-contact"
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
    v-if="hasPages && mdAndUp"
    permanent
    rail
    expand-on-hover
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
  </v-navigation-drawer>

  <v-bottom-navigation
    v-if="hasPages && !mdAndUp"
    :model-value="bottomSelected"
    mode="shift"
    color="primary"
    grow
    elevation="8"
  >
    <v-btn
      v-for="item in bottomItems"
      :key="item.to"
      :to="item.to"
      :value="item.to"
      :active="isActive(item)"
      :data-testid="`bottom-${item.to}`"
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

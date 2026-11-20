import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import AppNavigation from '~/components/layout/appNavigation.vue'
import { autofix, moderator, userAnna, workshopOwner } from '../../../.storybook/mocks/fixtures'
import { authService } from '~/services'
import { useRouter } from 'vue-router'
import { navigatedTo } from '../../../.storybook/mocks/nuxt'

const meta = {
  title: 'Common/Navigation',
  component: AppNavigation,
  render: () => ({ components: { AppNavigation }, template: '<app-navigation /><div class="pa-8" style="height: 400px" />' }),
} satisfies Meta<typeof AppNavigation>

export default meta
type Story = StoryObj<typeof meta>

export const Guest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Logowanie' })).toBeVisible()
    await expect(canvas.queryByTestId('account-menu')).toBeNull()
  },
}

export const Customer: Story = {
  parameters: { app: { user: userAnna } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('nav-/user/notifications')).toBeInTheDocument()
    await expect(canvas.getByTestId('nav-/user/history')).toBeInTheDocument()
    await expect(canvas.queryByTestId('nav-/company/pricing')).toBeNull()
  },
}

export const Workshop: Story = {
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('nav-/company/clients')).toBeInTheDocument()
    await expect(canvas.getByTestId('nav-/company/pricing')).toBeInTheDocument()
  },
}

/** Every role reaches its own profile from the account menu (moderators included). */
export const ModeratorProfileLink: Story = {
  parameters: { app: { user: moderator } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('account-menu'))
    await expect(await screen.findByTestId('my-profile')).toHaveAttribute('href', '/moderator/profile')
  },
}

export const Moderator: Story = {
  parameters: { app: { user: moderator } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('nav-/moderator/stats')).toBeInTheDocument()
    await expect(canvas.getByTestId('nav-/moderator/reviews')).toBeInTheDocument()
  },
}

export const AccountMenuLogout: Story = {
  parameters: { app: { user: userAnna } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('account-menu'))
    await expect(await screen.findByText('Anna Kowalska')).toBeVisible()
    await userEvent.click(screen.getByTestId('logout'))
    await waitFor(() => expect(authService.logOut).toHaveBeenCalled())
    await waitFor(() => expect(navigatedTo).toContain('/'))
  },
}

/** Notification centre: unread badge, events from the workshop, mark as read. */
export const CustomerNotifications: Story = {
  parameters: { app: { user: userAnna } },
  play: async ({ canvasElement }) => {
    const bell = within(canvasElement).getByTestId('feed-bell')
    await waitFor(() => expect(within(bell).getByText(/\d/)).toBeInTheDocument())
    await userEvent.click(bell)
    const menu = await screen.findByTestId('feed-menu')
    await expect(within(menu).getByText('Skoda Octavia gotowy do odbioru – oceń naprawę!')).toBeVisible()
    await expect(within(menu).getByText(/Warsztat umówił wizytę dla BMW Seria 3/)).toBeVisible()
    await userEvent.click(within(menu).getByTestId('feed-mark-read'))
    await waitFor(() => expect(within(menu).queryByTestId('feed-mark-read')).toBeNull())
  },
}

export const WorkshopNotifications: Story = {
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('feed-bell'))
    const menu = await screen.findByTestId('feed-menu')
    await expect(within(menu).getAllByText(/Nowa rezerwacja: BMW Seria 3 \(Anna Kowalska\)/).length).toBeGreaterThan(0)
    await expect(within(menu).getByText(/Anna Kowalska odwołał\(a\) wizytę/)).toBeVisible()
  },
}

/** Each moderator section is its own page – only the current one is highlighted. */
export const ModeratorActivePage: Story = {
  parameters: { app: { user: moderator } },
  render: () => ({
    components: { AppNavigation },
    setup() {
      useRouter().replace('/moderator/companies')
    },
    template: '<app-navigation /><div class="pa-8" style="height: 400px" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByTestId('nav-/moderator/companies')).toHaveClass('v-list-item--active'))
    await expect(canvasElement.querySelectorAll('[data-testid^="nav-"].v-list-item--active')).toHaveLength(1)
  },
}

/** Desktop avatar menu: my profile, contact, log out – nothing else (pages are in the side rail). */
export const AccountMenuDesktop: Story = {
  parameters: { app: { user: moderator } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('account-menu'))
    const card = await screen.findByTestId('account-card')
    const entries = [...card.querySelectorAll('.v-list-item')].map(el => el.getAttribute('data-testid'))
    await expect(entries).toEqual(['my-profile', 'menu-contact', 'logout'])
  },
}

/** Moderator on a phone: no drawer; repairs, companies, messages, statistics at the bottom; the rest in the avatar menu. */
export const ModeratorPhone: Story = {
  parameters: { app: { user: moderator } },
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const bar = await waitFor(() => {
      const el = canvasElement.querySelector('.v-bottom-navigation')
      if (!el) throw new Error('no bottom bar yet')
      return el as HTMLElement
    })
    await expect(canvasElement.querySelector('.v-navigation-drawer')).toBeNull()
    const bottom = [...bar.querySelectorAll('a.v-btn')].map(el => el.getAttribute('href'))
    await expect(bottom).toEqual(['/moderator/repairs', '/moderator/companies', '/moderator/messages', '/moderator/stats'])
    await userEvent.click(within(canvasElement).getByTestId('account-menu'))
    const card = await screen.findByTestId('account-card')
    const entries = [...card.querySelectorAll('.v-list-item')].map(el => el.getAttribute('data-testid'))
    await expect(entries).toEqual(['menu-/moderator/services', 'menu-/moderator/clients', 'menu-/moderator/reviews', 'my-profile', 'menu-contact', 'logout'])
  },
}

/** Language menu with flags; the whole bar switches language. */
export const LanguageFlags: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('language-menu')).toHaveTextContent('PL')
    await userEvent.click(canvas.getByTestId('language-menu'))
    await userEvent.click(await screen.findByTestId('language-en'), { pointerEventsCheck: 0 })
    await waitFor(() => expect(canvas.getByTestId('language-menu')).toHaveTextContent('EN'))
    await expect(canvas.getByTestId('center-nav')).toHaveTextContent(/workshops/i)
  },
}

export const ThemeToggle: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByTestId('theme-toggle')
    await expect(toggle.querySelector('.mdi-white-balance-sunny')).not.toBeNull()
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle.querySelector('.mdi-moon-waning-crescent')).not.toBeNull())
  },
}

/** Phones: the bottom bar highlights the current page (and shows its label). */
export const CustomerBottomBar: Story = {
  parameters: { app: { user: userAnna } },
  globals: { viewport: { value: 'mobile1' } },
  render: () => ({
    components: { AppNavigation },
    setup() {
      useRouter().replace('/user/notifications')
    },
    template: '<app-navigation /><div class="pa-8" style="height: 400px" />',
  }),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(960)
    const bar = await waitFor(() => {
      const el = canvasElement.querySelector('.v-bottom-navigation')
      if (!el) throw new Error('no bottom bar yet')
      return el
    })
    await waitFor(() => expect(bar.querySelector('.v-btn--selected')).toHaveAttribute('href', '/user/notifications'))
  },
}

/** Pages outside the centre links (e.g. login) highlight nothing – not "Home". */
export const GuestOnLoginPage: Story = {
  render: () => ({
    components: { AppNavigation },
    setup() {
      useRouter().replace('/auth/login')
    },
    template: '<app-navigation /><div class="pa-8" style="height: 400px" />',
  }),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByTestId('center-nav')
    await waitFor(() => expect(nav.querySelectorAll('.v-tab--selected')).toHaveLength(0))
  },
}

/** The side rail holds only the role's pages – profile and log out are in the account menu, never twice. */
export const RailWithoutAccountItems: Story = {
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector('.v-navigation-drawer') as HTMLElement
    await expect(within(rail).getByTestId('nav-/company/pricing')).toBeInTheDocument()
    await expect(within(rail).queryByTestId('nav-/company/profile')).toBeNull()
    await expect(within(rail).queryByText(/Wyloguj/)).toBeNull()
    await userEvent.click(within(canvasElement).getByTestId('account-menu'))
    await expect(await screen.findByTestId('my-profile')).toHaveAttribute('href', '/company/profile')
    await expect(screen.getByTestId('logout')).toBeVisible()
  },
}

/** Navigation inside the real app frame (v-layout + v-main) – shows the rail as on a desktop. */
const inLayout = {
  components: { AppNavigation },
  template: '<v-layout style="height: 560px"><app-navigation /><v-main><div class="pa-8 text-medium-emphasis">…</div></v-main></v-layout>',
}

export const CustomerInLayout: Story = {
  parameters: { app: { user: userAnna } },
  render: () => inLayout,
  play: async ({ canvasElement }) => {
    // The rail must be on screen (not just in the DOM, translated off-screen).
    const rail = canvasElement.querySelector('.v-navigation-drawer') as HTMLElement
    await waitFor(() => expect(rail.getBoundingClientRect().left).toBeGreaterThanOrEqual(0))
    await expect(within(canvasElement).getByTestId('nav-/user/history')).toBeVisible()
    await expect(within(canvasElement).queryByTestId('nav-/user/profile')).toBeNull()
  },
}

export const ModeratorInLayout: Story = {
  parameters: { app: { user: moderator } },
  render: () => inLayout,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId('nav-/moderator/messages')).toBeVisible()
    await expect(within(canvasElement).queryByTestId('nav-/moderator/profile')).toBeNull()
  },
}

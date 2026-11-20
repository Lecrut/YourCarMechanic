import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import AppNavigation from './appNavigation.vue'
import { autofix, moderator, userAnna, workshopOwner } from '../../.storybook/mocks/fixtures'
import { authService } from '~/services'
import { navigatedTo } from '../../.storybook/mocks/nuxt'

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
    await expect(canvas.getByTestId('nav-/moderator?tab=stats')).toBeInTheDocument()
    await expect(canvas.getByTestId('nav-/moderator?tab=reviews')).toBeInTheDocument()
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
    await expect(within(menu).getByText('Skoda Octavia gotowy – wystaw opinię!')).toBeVisible()
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

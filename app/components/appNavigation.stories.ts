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

import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen } from 'storybook/test'
import UpdateBanner from '~/components/layout/updateBanner.vue'

const meta = {
  title: 'Common/Update banner',
  component: UpdateBanner,
} satisfies Meta<typeof UpdateBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Hidden: Story = {
  play: async () => {
    await expect(screen.queryByTestId('update-banner')).toBeNull()
  },
}

/** A newer build was deployed: the banner offers a reload. */
export const NewVersion: Story = {
  render: () => ({
    components: { UpdateBanner },
    setup: () => {
      useSharedStore().updateAvailable = true
    },
    template: '<update-banner />',
  }),
  play: async () => {
    await expect(await screen.findByText('Dostępna nowa wersja strony')).toBeVisible()
    await expect(screen.getByRole('button', { name: 'Odśwież' })).toBeVisible()
  },
}

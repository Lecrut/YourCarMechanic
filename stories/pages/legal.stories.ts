import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import Terms from '~/pages/terms.vue'
import Privacy from '~/pages/privacy.vue'

const meta = {
  title: 'Pages/Legal',
  component: Terms,
} satisfies Meta<typeof Terms>

export default meta
type Story = StoryObj<typeof meta>

/** The terms are read from app/assets/legal/terms.md and rendered in a card. */
export const TermsPage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Regulamin' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: '1. Postanowienia ogólne' })).toBeVisible()
    await expect(canvas.getAllByRole('listitem').length).toBeGreaterThan(10)
  },
}

export const PrivacyPage: Story = {
  render: () => ({ components: { Privacy }, template: '<privacy />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Polityka prywatności' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: '6. Twoje prawa' })).toBeVisible()
  },
}

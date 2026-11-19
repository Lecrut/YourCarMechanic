import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import ModeratorIndex from './index.vue'
import { moderator } from '../../../.storybook/mocks/fixtures'
import { moderatorService, reviewsService, servicesCatalogService } from '~/services'

const meta = {
  title: 'Pages/Moderator',
  component: ModeratorIndex,
  parameters: { app: { user: moderator } },
} satisfies Meta<typeof ModeratorIndex>

export default meta
type Story = StoryObj<typeof meta>

const openTab = async (root: HTMLElement, name: RegExp) =>
  userEvent.click(within(root).getByRole('tab', { name }))

export const Statistics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(moderatorService.getAllFixes).toHaveBeenCalled())
    await expect(await canvas.findByText('Wszystkie naprawy')).toBeVisible()
    await expect(canvas.getAllByText('Średni czas naprawy').length).toBeGreaterThan(0)
    await expect(canvas.getByTestId('stats-sparkline')).toBeVisible()
    await expect(await within(canvas.getByTestId('stats-workshops')).findByText('AutoFix Kraków')).toBeVisible()
  },
}

/** Blocked companies are unlocked after signing the contract. */
export const UnlockCompany: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Firmy/)
    const table = await within(canvasElement).findByTestId('companies-table')
    await expect(await within(table).findByText('Garage Nowy')).toBeVisible()
    await expect(within(table).getByText('Zablokowana')).toBeVisible()
    await userEvent.click(within(table).getByTestId('unlock-company'))
    await waitFor(() => expect(moderatorService.setWorkshopStatus).toHaveBeenCalledWith('companies/nowy', 'approved'))
    await waitFor(() => expect(within(table).queryByText('Zablokowana')).toBeNull())
  },
}

export const AddCompany: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Firmy/)
    await userEvent.click(await within(canvasElement).findByTestId('add-company'))
    await expect(await screen.findByTestId('company-owner')).toBeVisible()
    await userEvent.click(screen.getByTestId('save-company'))
    await expect((await screen.findAllByText('Pole jest wymagane')).length).toBeGreaterThan(0)
    await expect(moderatorService.createWorkshop).not.toHaveBeenCalled()
  },
}

/** Deleting a company is a soft delete and can be undone. */
export const SoftDeleteCompany: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Firmy/)
    const table = await within(canvasElement).findByTestId('companies-table')
    await userEvent.click((await within(table).findAllByTestId('delete-company'))[0]!)
    await expect(await screen.findByText(/Dane i historia napraw zostaną w bazie/)).toBeVisible()
    await userEvent.click(screen.getByTestId('confirm-delete'))
    await waitFor(() => expect(moderatorService.deleteWorkshop).toHaveBeenCalled())
    await expect(await within(table).findByText('Usunięte')).toBeVisible()
  },
}

export const ServiceCatalog: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Usługi/)
    await userEvent.click(await within(canvasElement).findByTestId('add-service'))
    await userEvent.type((await screen.findByTestId('service-key')).querySelector('input')!, 'detailing')
    await userEvent.type(screen.getByTestId('service-name-pl').querySelector('input')!, 'Detailing')
    await userEvent.type(screen.getByTestId('service-name-en').querySelector('input')!, 'Detailing')
    await userEvent.click(screen.getByTestId('save-service'))
    await waitFor(() => expect(servicesCatalogService.saveService).toHaveBeenCalled())
    await expect(await within(canvasElement).findByText('detailing')).toBeVisible()
  },
}

export const Clients: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Klienci/)
    const table = await within(canvasElement).findByTestId('users-table')
    await expect(await within(table).findByText('anna@example.com')).toBeVisible()
    await expect(within(table).getByText('serwis@example.com')).toBeVisible()
  },
}

export const ModerateReviews: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Opinie/)
    const table = await within(canvasElement).findByTestId('reviews-table')
    await expect(await within(table).findByText('Długo czekałem na auto.')).toBeVisible()
    await userEvent.click(within(table).getAllByTestId('toggle-review')[0]!)
    await waitFor(() => expect(reviewsService.setReviewHidden).toHaveBeenCalled())
    await expect(await within(table).findByText('Ukryta')).toBeVisible()
  },
}

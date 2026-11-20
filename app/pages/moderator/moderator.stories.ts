import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import ModeratorIndex from './index.vue'
import { moderator } from '../../../.storybook/mocks/fixtures'
import { contactService, moderatorService, reviewsService, servicesCatalogService } from '~/services'

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
    await waitFor(() => expect(moderatorService.watchAll).toHaveBeenCalled())
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
    await expect(await screen.findByTestId('company-owner-email')).toBeVisible()
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
    // hidden from the default list, still there (and restorable) under "show deleted"
    await userEvent.click(within(canvasElement).getByTestId('show-deleted').querySelector('input')!)
    await expect(await within(table).findByText('Usunięte')).toBeVisible()
  },
}

export const ServiceCatalog: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Usługi/)
    await userEvent.click(await within(canvasElement).findByTestId('add-service'))
    await userEvent.type((await screen.findByTestId('service-name-pl')).querySelector('input')!, 'Detailing')
    await userEvent.type(screen.getByTestId('service-name-en').querySelector('input')!, 'Detailing')
    await userEvent.click(screen.getByTestId('save-service'))
    await waitFor(() => expect(servicesCatalogService.saveService).toHaveBeenCalled())
    const [saved] = mocked(servicesCatalogService.saveService).mock.calls.at(-1)!
    await expect(saved.key).toBe('detailing')
  },
}

export const Clients: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Klienci/)
    const table = await within(canvasElement).findByTestId('users-table')
    await expect(await within(table).findByText('anna@example.com')).toBeVisible()
    await expect(within(table).queryByText('serwis@example.com')).toBeNull()
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

/** Contact-form inbox: open messages, status change, internal note. */
export const ContactInbox: Story = {
  play: async ({ canvasElement }) => {
    await openTab(canvasElement, /Zgłoszenia/)
    const table = await within(canvasElement).findByTestId('messages-table')
    await expect(await within(table).findByText('Nie mogę odwołać wizyty')).toBeVisible()
    // resolved messages are not in the "open" view
    await expect(within(table).queryByText('Dziękuję')).toBeNull()

    await userEvent.click(within(table).getByText('Nie mogę odwołać wizyty'))
    const detail = await screen.findByTestId('message-detail')
    // opening a new message marks it as in progress
    await waitFor(() => expect(contactService.setContactStatus).toHaveBeenCalledWith('contactMessages/m1', 'inProgress'))
    await userEvent.type(within(detail).getByTestId('message-note').querySelector('textarea')!, 'Oddzwonić do klienta')
    await userEvent.click(within(detail).getByTestId('save-message-note'))
    await waitFor(() => expect(contactService.setContactNote).toHaveBeenCalled())
    await expect(within(detail).getByTestId('reply-message')).toHaveAttribute('href', expect.stringContaining('mailto:jan@example.com'))
  },
}

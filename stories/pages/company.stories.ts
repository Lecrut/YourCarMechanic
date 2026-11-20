import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import Pricing from '~/pages/company/pricing.vue'
import Clients from '~/pages/company/clients.vue'
import CompanyIndex from '~/pages/company/index.vue'
import { autofix, pendingWorkshop, workshopOwner } from '../../.storybook/mocks/fixtures'
import { fixesService, pricingService, workshopsService } from '~/services'

const meta = {
  title: 'Pages/Workshop',
  component: Pricing,
  parameters: { app: { user: workshopOwner, company: autofix } },
} satisfies Meta<typeof Pricing>

export default meta
type Story = StoryObj<typeof meta>

/** Price table shows the total per car segment: labor × rate + parts. */
export const PriceList: Story = {
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('price-table')
    await expect(await within(table).findByText('Wymiana oleju i filtra')).toBeVisible()
    // standard: 0.5–1 h × 150 + 200–300 = 275–450
    await expect(within(table).getByText('275 – 450 PLN')).toBeVisible()
    // services without prices are listed as a warning
    await expect(within(canvasElement).getByText('Usługi bez cennika – klienci nie zobaczą dla nich wyceny:')).toBeVisible()
  },
}

export const ChangeHourlyRate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('save-rate')).toBeDisabled()
    const rate = canvas.getByTestId('hourly-rate').querySelector('input')!
    await userEvent.clear(rate)
    await userEvent.type(rate, '180')
    await userEvent.click(canvas.getByTestId('save-rate'))
    await waitFor(() => expect(workshopsService.updateWorkshop).toHaveBeenCalled())
    const [saved] = mocked(workshopsService.updateWorkshop).mock.calls.at(-1)!
    await expect(saved.hourlyRate).toBe(180)
  },
}

/** Ranges are validated: "to" cannot be lower than "from". */
export const PriceItemValidation: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('add-price'))
    const min = (await screen.findByTestId('labor-min')).querySelector('input')!
    const max = screen.getByTestId('labor-max').querySelector('input')!
    await userEvent.clear(min)
    await userEvent.type(min, '3')
    await userEvent.clear(max)
    await userEvent.type(max, '1')
    await userEvent.click(screen.getByTestId('save-price'))
    await expect(await screen.findByText('„Do” nie może być mniejsze niż „Od”')).toBeInTheDocument()
    await expect(pricingService.savePriceListItem).not.toHaveBeenCalled()
  },
}

/** Client list: consent filter is on by default (GDPR). */
export const ClientList: Story = {
  render: () => ({ components: { Clients }, template: '<clients />' }),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('clients-table')
    await expect(await within(table).findByText('Anna Kowalska')).toBeVisible()
    await expect(within(table).getByText('600100200')).toBeVisible()
    await expect(within(table).getAllByTestId('book-client').length).toBeGreaterThan(0)
  },
}

/** Booking for a client creates an unconfirmed, workshop-created fix. */
export const BookForClient: Story = {
  render: () => ({ components: { Clients }, template: '<clients />' }),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('clients-table')
    await userEvent.click((await within(table).findAllByTestId('book-client'))[0]!)
    await expect(await screen.findByText('Wizyta zostanie oznaczona jako umówiona przez warsztat i będzie czekać na potwierdzenie klienta.')).toBeVisible()
    await userEvent.click(screen.getByTestId('submit-booking'))
    // invalid form (no services/date) – nothing is sent
    await expect((await screen.findAllByText('Pole jest wymagane')).length).toBeGreaterThan(0)
    await expect(fixesService.addFix).not.toHaveBeenCalled()
  },
}

export const BlockedCompany: Story = {
  parameters: { app: { user: workshopOwner, company: pendingWorkshop } },
  render: () => ({ components: { CompanyIndex }, template: '<company-index />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('pending-banner')).toHaveTextContent('oczekuje na podpisanie umowy')
    await expect(canvas.getByRole('link', { name: /Umów klienta/ })).toHaveClass('v-btn--disabled')
  },
}

export const RepairsLive: Story = {
  render: () => ({ components: { CompanyIndex }, template: '<company-index />' }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(fixesService.watchActiveFixes).toHaveBeenCalledWith('companyRef', autofix.reference, expect.any(Function), expect.any(Function)))
    // Default view: the week board with the "at the workshop" panel.
    await expect(await within(canvasElement).findByTestId('week-board')).toBeVisible()
    await expect(within(canvasElement).getByTestId('at-workshop')).toHaveTextContent('BMW Seria 3')
  },
}

export const RepairsAsList: Story = {
  render: () => ({ components: { CompanyIndex }, template: '<company-index />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(within(await canvas.findByTestId('view-toggle')).getByText('Lista'))
    await expect((await canvas.findAllByTestId('repair-card')).length).toBe(3)
    // search narrows the list
    await userEvent.type(canvas.getByTestId('repair-search').querySelector('input')!, 'promocja')
    await waitFor(() => expect(canvas.getAllByTestId('repair-card')).toHaveLength(1))
  },
}

/** Workshop notes: one for the client, one internal. */
export const RepairNotes: Story = {
  render: () => ({ components: { CompanyIndex }, template: '<company-index />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(within(await canvas.findByTestId('view-toggle')).getByText('Lista'))
    const card = (await canvas.findAllByTestId('repair-card')).find(c => c.textContent?.includes('Wycena mechanika'))!
    await userEvent.click(within(card).getByTestId('open-details'))
    // the workshop sees who the client is, not just a phone number
    await expect(await screen.findByTestId('client-name')).toHaveTextContent('Anna Kowalska')
    const internal = (await screen.findByTestId('internal-note-input')).querySelector('textarea')!
    await waitFor(() => expect(internal).toHaveValue('Klient prosił o telefon przed wymianą opon.'))
    await userEvent.type(internal, ' Oddzwonić po 16.')
    await userEvent.click(screen.getByTestId('save-internal-note'))
    await waitFor(() => expect(fixesService.setInternalNote).toHaveBeenCalled())
  },
}

/** Promotions: running ones are listed; the form validates the date range. */
export const Promotions: Story = {
  play: async ({ canvasElement }) => {
    const section = await within(canvasElement).findByTestId('promotions')
    await expect(await within(section).findByText(/Jesienna wymiana opon · −20%/)).toBeVisible()
    await expect(within(section).getByText('Trwa')).toBeVisible()

    await userEvent.click(within(section).getByTestId('add-promotion'))
    await userEvent.type((await screen.findByTestId('promotion-title')).querySelector('input')!, 'Black Friday')
    const to = screen.getByTestId('promotion-to').querySelector('input')!
    await userEvent.clear(to)
    await userEvent.type(to, '2000-01-01')
    await userEvent.click(screen.getByTestId('save-promotion'))
    await expect(await screen.findByText('Koniec nie może być przed początkiem')).toBeInTheDocument()
    await expect(pricingService.savePromotion).not.toHaveBeenCalled()
  },
}

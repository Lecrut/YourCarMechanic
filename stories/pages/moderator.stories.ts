import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import Stats from '~/pages/moderator/stats.vue'
import Companies from '~/pages/moderator/companies.vue'
import Services from '~/pages/moderator/services.vue'
import ClientsPage from '~/pages/moderator/clients.vue'
import Reviews from '~/pages/moderator/reviews.vue'
import Messages from '~/pages/moderator/messages.vue'
import Repairs from '~/pages/moderator/repairs.vue'
import { moderator } from '../../.storybook/mocks/fixtures'
import { contactService, moderatorService, reviewsService, servicesCatalogService } from '~/services'

const meta = {
  title: 'Pages/Moderator',
  component: Stats,
  parameters: { app: { user: moderator } },
} satisfies Meta<typeof Stats>

export default meta
type Story = StoryObj<typeof meta>

/** No element inside `root` scrolls sideways and nothing sticks out of the screen. */
async function expectNoSidewaysScroll(root: Element) {
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const ox = getComputedStyle(el).overflowX
    if (ox === 'auto' || ox === 'scroll') await expect(el.scrollWidth, el.className).toBeLessThanOrEqual(el.clientWidth + 1)
    const r = el.getBoundingClientRect()
    if (r.width > 0) await expect(r.right, el.className).toBeLessThanOrEqual(window.innerWidth + 1)
  }
}

/** Every moderator section is a separate page. */
const page = (component: object) => () => ({ components: { Page: component }, template: '<page />' })

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
  render: page(Companies),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('companies-table')
    await expect(await within(table).findByText('Garage Nowy')).toBeVisible()
    await expect(within(table).getByText('Zablokowana')).toBeVisible()
    await userEvent.click(within(table).getByTestId('unlock-company'))
    await waitFor(() => expect(moderatorService.setWorkshopStatus).toHaveBeenCalledWith('companies/nowy', 'approved'))
    await waitFor(() => expect(within(table).queryByText('Zablokowana')).toBeNull())
  },
}

export const AddCompany: Story = {
  render: page(Companies),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('add-company'))
    await expect(await screen.findByTestId('company-owner-email')).toBeVisible()
    await userEvent.click(screen.getByTestId('save-company'))
    await expect((await screen.findAllByText('Pole jest wymagane')).length).toBeGreaterThan(0)
    await expect(moderatorService.createWorkshop).not.toHaveBeenCalled()
  },
}

/** Deleting a company is a soft delete and can be undone. */
export const SoftDeleteCompany: Story = {
  render: page(Companies),
  play: async ({ canvasElement }) => {
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
  render: page(Services),
  play: async ({ canvasElement }) => {
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
  render: page(ClientsPage),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('users-table')
    await expect(await within(table).findByText('anna@example.com')).toBeVisible()
    await expect(within(table).queryByText('serwis@example.com')).toBeNull()
  },
}

export const ModerateReviews: Story = {
  render: page(Reviews),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('reviews-table')
    await expect(await within(table).findByText('Długo czekałem na auto.')).toBeVisible()
    await userEvent.click(within(table).getAllByTestId('toggle-review')[0]!)
    await waitFor(() => expect(reviewsService.setReviewHidden).toHaveBeenCalled())
    await expect(await within(table).findByText('Ukryta')).toBeVisible()
  },
}

/** Contact-form inbox: open messages, status change, internal note. */
export const ContactInbox: Story = {
  render: page(Messages),
  play: async ({ canvasElement }) => {
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

/** Suspending a company cancels its open visits; clients get the reason. */
export const SuspendCancelsVisits: Story = {
  render: page(Companies),
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('companies-table')
    await userEvent.click((await within(table).findAllByTestId('suspend-company'))[0]!)
    const dialog = await screen.findByTestId('suspend-dialog')
    await expect(dialog).toHaveTextContent('Zaplanowane wizyty zostaną odwołane: 3')
    await userEvent.click(within(dialog).getByTestId('confirm-suspend'))
    await waitFor(() => expect(moderatorService.cancelOpenFixes).toHaveBeenCalledWith('companies/autofix', expect.stringContaining('zawieszony')))
    await waitFor(() => expect(moderatorService.setWorkshopStatus).toHaveBeenCalledWith('companies/autofix', 'suspended'))
  },
}

/** Phone: no big header, tight paddings, the table switches to stacked rows instead of scrolling sideways. */
export const CompaniesOnPhone: Story = {
  render: page(Companies),
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('companies-table')
    await waitFor(() => expect(table.querySelector('.v-data-table__tr--mobile')).not.toBeNull())
    await expect(within(canvasElement).queryByRole('heading', { name: 'Firmy' })).toBeNull()
    // Nothing sticks out to the right (long chips used to widen the table beyond the screen).
    const inner = table.querySelector('table')!
    const wrapper = table.querySelector('.v-table__wrapper')!
    await expect(inner.getBoundingClientRect().width).toBeLessThanOrEqual(wrapper.clientWidth + 1)
  },
}

/** Desktop: the page header is shown; statistics tiles open their own pages. */
export const StatisticsTiles: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByTestId('stat-pending')).toHaveAttribute('href', '/moderator/companies')
    await expect(canvas.getByTestId('stat-reviews')).toHaveAttribute('href', '/moderator/reviews')
  },
}

/** Phone: the inbox table fits the screen and a message opens full screen with everything reachable. */
export const MessagesOnPhone: Story = {
  render: page(Messages),
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByTestId('messages-table')
    await waitFor(() => expect(table.querySelector('.v-data-table__tr--mobile')).not.toBeNull())
    const inner = table.querySelector('table')!
    await expect(inner.getBoundingClientRect().width).toBeLessThanOrEqual(table.querySelector('.v-table__wrapper')!.clientWidth + 1)
    await userEvent.click(within(table).getByText('Nie mogę odwołać wizyty'))
    const detail = await screen.findByTestId('message-detail')
    await expect(detail).toHaveTextContent('Widoczna tylko dla moderatorów')
    const reply = within(detail).getByTestId('reply-message').getBoundingClientRect()
    await expect(reply.right).toBeLessThanOrEqual(window.innerWidth)
  },
}

/** Tablet: filters wrap into rows, the switch label stays on whole words; the repair dialog is titled "Naprawa". */
export const RepairsOnTablet: Story = {
  render: page(Repairs),
  globals: { viewport: { value: 'tabletLandscape' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Rendered text lines of the label (it used to break after every few letters).
    const range = document.createRange()
    range.selectNodeContents(await canvas.findByText('Aktywne naprawy'))
    const lines = new Set([...range.getClientRects()].map(r => Math.round(r.top)))
    await expect(lines.size).toBeLessThanOrEqual(2)

    const table = canvas.getByTestId('fixes-table')
    await userEvent.click((await within(table).findAllByRole('row'))[1]!)
    const title = await screen.findByText('Naprawa')
    await expect(title.closest('.v-card-title')).not.toBeNull()
    await expect(screen.getByTestId('repair-date')).toBeVisible()
  },
}

/** Phone and landscape tablet: the open/all/deleted filters wrap instead of scrolling sideways. */
const messageFilters: Story['play'] = async ({ canvasElement }) => {
  const filters = await within(canvasElement).findByTestId('messages-view')
  await expect(within(filters).getByText('Usunięte')).toBeVisible()
  await expectNoSidewaysScroll(filters.closest('.v-row')!)
}
export const MessageFiltersOnPhone: Story = { render: page(Messages), globals: { viewport: { value: 'mobile1' } }, play: messageFilters }
export const MessageFiltersOnTablet: Story = { render: page(Messages), globals: { viewport: { value: 'tabletLandscape' } }, play: messageFilters }

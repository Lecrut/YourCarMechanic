import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import RepairDetails from './repairDetails.vue'
import RepairList from './repairList.vue'
import { autofix, fixBookedByWorkshop, fixWithProposal, moderator, newFix, userAnna, workshopOwner } from '../../../.storybook/mocks/fixtures'
import { mapIFix } from '~/models/fix'
import { fixesService, moderatorService } from '~/services'

/** Opens a v-select inside the status form once its expand transition finished. */
async function pickStatus(label: string) {
  const combobox = within(await screen.findByTestId('status-type')).getAllByRole('combobox')[0]!
  await waitFor(() => expect(getComputedStyle(combobox).pointerEvents).not.toBe('none'))
  await waitFor(() => expect(combobox.closest('.v-expand-transition-enter-active')).toBeNull())
  await userEvent.click(combobox)
  const option = (await screen.findByText(label, { selector: '.v-list-item-title' })).closest('.v-list-item')!
  // Vuetify's overlay container is `pointer-events: none` with `auto` on the menu content –
  // real clicks work, user-event's ancestor heuristic does not see that.
  await userEvent.click(option, { pointerEventsCheck: 0 })
}

const meta = {
  title: 'Fix/RepairDetails',
  component: RepairDetails,
  args: { fix: fixWithProposal, mode: 'user', modelValue: true },
  parameters: { app: { user: userAnna } },
} satisfies Meta<typeof RepairDetails>

export default meta
type Story = StoryObj<typeof meta>

/** The client compares current vs proposed scope and accepts. */
export const ClientAcceptsProposal: Story = {
  play: async () => {
    // The workshop's note for the client is shown; the internal one is not.
    await expect(await screen.findByTestId('public-note')).toHaveTextContent('zalecamy wymianę przed zimą')
    await expect(screen.queryByTestId('internal-note-input')).toBeNull()
    const panel = await screen.findByTestId('proposal-decision')
    await expect(within(panel).getByText('Obecnie')).toBeVisible()
    await expect(within(panel).getByText('525 – 800 PLN')).toBeVisible()
    await userEvent.click(within(panel).getByTestId('accept-proposal'))
    await waitFor(() => expect(fixesService.acceptProposal).toHaveBeenCalled())
  },
}

export const ClientRejectsProposal: Story = {
  play: async () => {
    await userEvent.click(await screen.findByTestId('reject-proposal'))
    await waitFor(() => expect(fixesService.rejectProposal).toHaveBeenCalled())
  },
}

/** A workshop quote outside the booking estimate is rejected by the form. */
export const WorkshopQuoteMustFitEstimate: Story = {
  args: { fix: mapIFix({ ...fixWithProposal, proposal: null }), mode: 'workshop' },
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async () => {
    await userEvent.click(await screen.findByTestId('add-status'))

    await pickStatus('Wycena mechanika')

    const cost = screen.getByTestId('status-cost').querySelector('input')!
    await userEvent.type(cost, '9999')
    await userEvent.click(screen.getByTestId('save-status'))
    await expect(await screen.findByText(/Wycena musi mieścić się w widełkach 375 – 600 PLN/)).toBeInTheDocument()
    await expect(fixesService.addNotification).not.toHaveBeenCalled()

    await userEvent.clear(cost)
    await userEvent.type(cost, '500')
    await userEvent.click(screen.getByTestId('save-status'))
    await waitFor(() => expect(fixesService.addNotification).toHaveBeenCalled())
  },
}

export const WorkshopCanProposeChange: Story = {
  args: { fix: mapIFix({ ...fixWithProposal, proposal: null }), mode: 'workshop' },
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async () => {
    await userEvent.click(await screen.findByTestId('propose-change'))
    await expect(await screen.findByText('Klient musi zaakceptować zmianę – do tego czasu obowiązuje obecny zakres')).toBeVisible()
    await userEvent.click(screen.getByTestId('send-proposal'))
    await waitFor(() => expect(fixesService.proposeChange).toHaveBeenCalled())
  },
}

/** Moderators may cancel any repair – a reason is required. */
export const ModeratorCancels: Story = {
  args: { fix: newFix, mode: 'moderator' },
  parameters: { app: { user: moderator } },
  play: async () => {
    await expect(await screen.findByText('Moderacja')).toBeVisible()
    await userEvent.click(screen.getByTestId('add-status'))
    await pickStatus('Anulowane przez moderatora')
    await userEvent.click(screen.getByTestId('save-status'))
    await expect((await screen.findAllByText('Pole jest wymagane')).length).toBeGreaterThan(0)
    await expect(fixesService.addNotification).not.toHaveBeenCalled()
    await expect(moderatorService.getAllFixes).not.toHaveBeenCalled()
  },
}

export const EmptyList: Story = {
  render: () => ({
    components: { RepairList },
    template: `<repair-list :fixes="[]" mode="user" />`,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId('repairs-empty')).toBeVisible()
  },
}

/** Until the client confirms a visit booked by the workshop, the workshop can only cancel it. */
export const UnconfirmedBookingOnlyCancel: Story = {
  args: { fix: fixBookedByWorkshop, mode: 'workshop' },
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async () => {
    await expect(await screen.findByText('Czeka na decyzję klienta')).toBeVisible()
    await userEvent.click(screen.getByTestId('add-status'))
    const combobox = within(await screen.findByTestId('status-type')).getAllByRole('combobox')[0]!
    await waitFor(() => expect(combobox.closest('.v-expand-transition-enter-active')).toBeNull())
    await userEvent.click(combobox)
    const options = await screen.findAllByRole('option')
    await expect(options.map(o => o.textContent?.trim())).toEqual(['Odwołane przez warsztat'])
  },
}

/** A proposed date must be a real slot: future, full hour, working day, opening hours. */
export const ProposalDateValidated: Story = {
  args: { fix: mapIFix({ ...fixWithProposal, proposal: null }), mode: 'workshop' },
  parameters: { app: { user: workshopOwner, company: autofix } },
  play: async () => {
    await userEvent.click(await screen.findByTestId('propose-change'))
    const input = (await screen.findByTestId('proposal-date')).querySelector('input')!
    await userEvent.clear(input)
    await userEvent.type(input, '2020-01-01T10:00')
    await userEvent.click(screen.getByTestId('send-proposal'))
    await expect(await screen.findByText('Termin musi być w przyszłości')).toBeInTheDocument()
    await expect(fixesService.proposeChange).not.toHaveBeenCalled()
  },
}

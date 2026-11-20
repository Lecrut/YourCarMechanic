import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import RepairCard from './repairCard.vue'
import { finishedFix, fixBookedByWorkshop, fixWithProposal, newFix, userAnna, workshopOwner, autofix } from '../../../.storybook/mocks/fixtures'
import { mapIFix } from '~/models/fix'
import { fixesService, reviewsService } from '~/services'

const meta = {
  title: 'Fix/RepairCard',
  component: RepairCard,
  parameters: { app: { user: userAnna } },
  args: { fix: newFix, mode: 'user' },
} satisfies Meta<typeof RepairCard>

export default meta
type Story = StoryObj<typeof meta>

export const Upcoming: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('BMW Seria 3')).toBeVisible()
    // Before the visit a client may cancel.
    await expect(canvas.getByTestId('cancel-repair')).toBeEnabled()
    await expect(canvas.queryByTestId('decision-chip')).toBeNull()
  },
}

export const CancelByClient: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('cancel-repair'))
    // Cancelling asks for confirmation first.
    await expect(await screen.findByText('Odwołać wizytę?')).toBeVisible()
    await expect(fixesService.addNotification).not.toHaveBeenCalled()
    await userEvent.click(screen.getByTestId('confirm-cancel'))
    await waitFor(() => expect(fixesService.addNotification).toHaveBeenCalled())
    const [, notification] = mocked(fixesService.addNotification).mock.calls.at(-1)!
    await expect(notification.notificationType).toBe('userCancel')
  },
}

/** Status and money are visible without opening the card. */
export const StatusAndCost: Story = {
  args: { fix: fixWithProposal },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('status-chip')).toHaveTextContent('Wycena mechanika')
    await expect(canvas.getByTestId('card-cost')).toHaveTextContent('480 PLN')
  },
}

export const ProposalNeedsDecision: Story = {
  args: { fix: fixWithProposal },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId('decision-chip')).toHaveTextContent('Wymaga decyzji')
  },
}

export const BookedByWorkshop: Story = {
  args: { fix: fixBookedByWorkshop },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('open-details'))
    const confirm = await screen.findByTestId('confirm-booking')
    await userEvent.click(confirm)
    await waitFor(() => expect(fixesService.confirmBooking).toHaveBeenCalled())
  },
}

export const FinishedCanBeReviewed: Story = {
  args: { fix: finishedFix },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('review-repair'))
    await userEvent.click(await screen.findByTestId('submit-review'))
    await waitFor(() => expect(reviewsService.addReview).toHaveBeenCalled())
    const [, rating] = mocked(reviewsService.addReview).mock.calls.at(-1)!
    await expect(rating).toBe(5)
  },
}

export const WorkshopView: Story = {
  parameters: { app: { user: workshopOwner, company: autofix } },
  args: { fix: newFix, mode: 'workshop' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Workshop sees the client's name; it cannot cancel before the visit (no-show only).
    await expect(canvas.getByText(/Anna Kowalska/)).toBeVisible()
    await expect(canvas.queryByTestId('cancel-repair')).toBeNull()
  },
}

/** After the review the card says so instead of offering another one. */
export const AlreadyReviewed: Story = {
  args: { fix: mapIFix({ ...finishedFix, reviewed: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('reviewed-chip')).toHaveTextContent('Oceniono')
    await expect(canvas.queryByTestId('review-repair')).toBeNull()
  },
}

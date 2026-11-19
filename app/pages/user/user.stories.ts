import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import BookRepair from './index.vue'
import Notifications from './notifications.vue'
import History from './history.vue'
import Profile from './profile.vue'
import { userAnna } from '../../../.storybook/mocks/fixtures'
import { carsService, fixesService } from '~/services'
import { useSharedStore } from '~/stores/sharedStore'
import { AppError } from '~/utils/errors'

const meta = {
  title: 'Pages/Customer',
  component: BookRepair,
  parameters: { app: { user: userAnna } },
} satisfies Meta<typeof BookRepair>

export default meta
type Story = StoryObj<typeof meta>

/** Step 1 cannot be skipped without choosing a service. */
export const BookingRequiresService: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /Dalej/ }))
    await expect(await canvas.findByTestId('step-error')).toHaveTextContent('Wybierz typ naprawy!')
  },
}

export const BookingStepTwo: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('service-oil'))
    await userEvent.type(canvas.getByTestId('description').querySelector('textarea')!, 'Kontrolka oleju')
    await userEvent.click(canvas.getByRole('button', { name: /Dalej/ }))
    await expect(await canvas.findByText('Wybierz samochód ze swojej listy')).toBeVisible()
    await waitFor(() => expect(carsService.getUserCars).toHaveBeenCalledWith(userAnna.reference))
  },
}

/** Active repairs are watched live; decisions from the workshop are highlighted. */
export const MyRepairs: Story = {
  render: () => ({ components: { Notifications }, template: '<notifications />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(fixesService.watchActiveFixes).toHaveBeenCalledWith('userRef', userAnna.reference, expect.any(Function), expect.any(Function)))
    await expect(await canvas.findByText('Sprawy od warsztatu do zatwierdzenia: 2')).toBeVisible()
    await expect(canvas.getAllByTestId('decision-chip')).toHaveLength(2)
  },
}

export const RepairHistory: Story = {
  render: () => ({ components: { History }, template: '<history />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findAllByTestId('repair-card')).length).toBe(2)
    // finished, unreviewed repair offers a review
    await expect(canvas.getByTestId('review-repair')).toBeVisible()
  },
}

export const ProfileAndCars: Story = {
  render: () => ({ components: { Profile }, template: '<profile />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('BMW Seria 3')).toBeVisible()
    await expect(canvas.getByText('Skoda Octavia')).toBeVisible()
    await userEvent.click(canvas.getByTestId('add-car'))
    await expect(await screen.findByText('Dodaj swój samochód')).toBeVisible()
  },
}

/** Errors from services show one global, specific message (no duplicated snackbars). */
export const SlotTakenMessage: Story = {
  render: () => ({ components: { Notifications }, template: '<notifications />' }),
  play: async () => {
    useSharedStore().fail(new AppError('errors.slotTaken'))
    const snackbars = await screen.findAllByTestId('error-snackbar')
    await expect(await screen.findByText('Ten termin został właśnie zajęty – wybierz inną godzinę')).toBeVisible()
    await expect(snackbars.length).toBe(1)
  },
}

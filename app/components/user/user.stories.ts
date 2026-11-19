import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import CarCard from './carCard.vue'
import WorkshopCard from './workshopCard.vue'
import { anniesCar, autofix, userAnna } from '../../../.storybook/mocks/fixtures'
import { carsService, workshopsService } from '~/services'

const meta = {
  title: 'User/Cards',
  component: CarCard,
  parameters: { app: { user: userAnna } },
  args: { car: anniesCar, onlyShow: false },
} satisfies Meta<typeof CarCard>

export default meta
type Story = StoryObj<typeof meta>

export const Car: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('BMW Seria 3')).toBeVisible()
    await expect(canvas.getByText('WBA8E9G50JNU12345')).toBeVisible()
  },
}

/** Deleting asks for confirmation and is a soft delete – repairs keep the car. */
export const DeleteCar: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('delete-car'))
    await expect(await screen.findByText(/Historia napraw i dane dla warsztatu zostaną zachowane/)).toBeVisible()
    await userEvent.click(screen.getByTestId('confirm-delete-car'))
    await waitFor(() => expect(carsService.deleteCar).toHaveBeenCalled())
  },
}

export const ReadOnlyCar: Story = {
  args: { onlyShow: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByTestId('edit-car')).toBeNull()
    await expect(within(canvasElement).queryByTestId('delete-car')).toBeNull()
  },
}

/** Workshop card while booking: estimate + rating, free hours watched live. */
export const Workshop: Story = {
  render: () => ({
    components: { WorkshopCard },
    setup: () => ({ autofix, rating: { average: 4.5, count: 12 }, estimate: { min: 375, max: 600 } }),
    template: `<v-row><v-col cols="12" md="6"><workshop-card :workshop="autofix" :is-presentation="false" :estimate="estimate" :rating="rating" /></v-col></v-row>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('estimate')).toHaveTextContent('375 – 600 PLN')
    await expect(canvas.getByText('4.5 (12)')).toBeVisible()

    await userEvent.click(canvas.getByTestId('available-dates'))
    await waitFor(() => expect(workshopsService.watchBookedSlots).toHaveBeenCalled())
    const hours = await screen.findAllByTestId('free-hour')
    // 6 days × 8 opening hours
    await expect(hours).toHaveLength(48)
  },
}

export const WorkshopWithoutPrices: Story = {
  render: () => ({
    components: { WorkshopCard },
    setup: () => ({ autofix }),
    template: `<workshop-card :workshop="autofix" :is-presentation="true" :estimate="null" :rating="{ average: 0, count: 0 }" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('estimate')).toHaveTextContent('Wycena po oględzinach')
    await expect(canvas.getByText('Brak opinii')).toBeVisible()
    await expect(canvas.queryByTestId('available-dates')).toBeNull()
  },
}

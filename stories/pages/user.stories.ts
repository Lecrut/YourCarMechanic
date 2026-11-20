import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, screen, userEvent, waitFor, within } from 'storybook/test'
import BookRepair from '~/pages/user/index.vue'
import Notifications from '~/pages/user/notifications.vue'
import History from '~/pages/user/history.vue'
import Profile from '~/pages/user/profile.vue'
import { userAnna } from '../../.storybook/mocks/fixtures'
import { authService, carsService, fixesService } from '~/services'
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

/** Step 3 lists workshops on the map that do the service *and* the car's brand (Bavaria Service is BMW/Audi/Mercedes only). */
export const BookingStepThreeMap: Story = {
  beforeEach: () => {
    localStorage.removeItem('user-location')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('service-oil'))
    await userEvent.type(canvas.getByTestId('description').querySelector('textarea')!, 'Kontrolka oleju')
    await userEvent.click(canvas.getByRole('button', { name: /Dalej/ }))
    await userEvent.click(await canvas.findByLabelText('Wybierz samochód ze swojej listy'))
    await userEvent.click(canvas.getByRole('combobox', { name: 'Wybierz samochód' }), { pointerEventsCheck: 0 })
    await userEvent.click(await screen.findByRole('option', { name: 'Skoda Octavia 2015' }), { pointerEventsCheck: 0 })
    await userEvent.type(canvas.getByLabelText('Przebieg'), '180000')
    await userEvent.click(canvas.getByRole('button', { name: /Dalej/ }))

    await waitFor(() => expect(canvas.getAllByTestId('finder-item')).toHaveLength(1))
    await expect(canvas.getByTestId('finder-item')).toHaveTextContent('AutoFix Kraków')
    await expect(canvas.getByTestId('finder-item')).not.toHaveTextContent('Bavaria')
    await userEvent.click(canvas.getByTestId('available-dates'))
    await expect(await screen.findByRole('dialog')).toHaveTextContent('AutoFix Kraków')
    // Free hours load right away (the dialog mounts already open) – pick the first one and book.
    const free = (await screen.findAllByTestId('free-hour')).find(el => !el.classList.contains('v-chip--disabled'))!
    await userEvent.click(free)
    await userEvent.click(canvas.getByRole('button', { name: /Dalej/ }))
    await userEvent.click(await canvas.findByTestId('book'))
    await waitFor(() => expect(fixesService.addFix).toHaveBeenCalled())
    const [fix] = mocked(fixesService.addFix).mock.calls.at(-1)!
    await expect(fix).toMatchObject({ companyRef: 'companies/autofix', services: ['oil'], car: { manufacturer: 'Skoda' } })
  },
}

/** Active repairs are watched live; decisions from the workshop are highlighted. */
export const MyRepairs: Story = {
  render: () => ({ components: { Notifications }, template: '<notifications />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(fixesService.watchActiveFixes).toHaveBeenCalledWith('userRef', userAnna.reference, expect.any(Function), expect.any(Function)))
    await expect(await canvas.findByText('Sprawy od warsztatu do zatwierdzenia: 2')).toBeVisible()
    // one tile per car: the BMW with three open repairs, the Skoda with its history
    const tiles = await canvas.findAllByTestId('garage-car')
    await expect(tiles).toHaveLength(2)
    await expect(tiles[0]).toHaveTextContent('BMW Seria 3')
    await expect(within(tiles[0]!).getAllByTestId('garage-active')).toHaveLength(3)
    await expect(within(tiles[1]!).getAllByTestId('garage-history')).toHaveLength(1)
    await expect(within(tiles[0]!).getByTestId('garage-book')).toHaveAttribute('href', '/user?car=cars%2Fbmw')
    // nearest confirmed visit is highlighted on top
    await expect(canvas.getByTestId('next-visit')).toHaveTextContent('BMW Seria 3')
    await expect(canvas.getByTestId('next-visit')).toHaveTextContent(/jutro|pojutrze|za \d+ (dni|godzin)/)
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

/** Signed-in users switch the language in their account settings (one compact row with flags). */
export const ProfileLanguage: Story = {
  render: () => ({ components: { Profile }, template: '<profile />' }),
  play: async ({ canvasElement }) => {
    const settings = within(await within(canvasElement).findByTestId('account-settings'))
    await expect(settings.getByText('Polski')).toBeVisible()
    await userEvent.click(settings.getByTestId('profile-language-en'))
    await waitFor(() => expect(settings.getByText('English')).toBeVisible())
    await expect(settings.getByText('Language')).toBeVisible()
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

/** A new phone number reaches the workshop on upcoming visits. */
export const ProfileUpdateSyncsVisits: Story = {
  render: () => ({ components: { Profile }, template: '<profile />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /Edytuj/ }))
    const inputs = canvasElement.querySelectorAll('form input')
    const phone = inputs[2] as HTMLInputElement
    await userEvent.clear(phone)
    await userEvent.type(phone, '600999888')
    await userEvent.click(canvas.getByRole('button', { name: /Zapisz/ }))
    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalled())
    await waitFor(() => expect(fixesService.syncClientContact).toHaveBeenCalledWith('users/anna', 'Anna Kowalska', '600999888'))
  },
}
